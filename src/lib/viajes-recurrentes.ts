import { prisma } from "./db";
import { EstadoAsiento } from "@prisma/client";

/** Genera las próximas N fechas de un día de semana + hora dados */
export function proximasOcurrencias(
  diaSemana: number,
  hora: string,
  cantidad: number,
  desde: Date = new Date()
): Date[] {
  const [h, m] = hora.split(":").map(Number);
  const result: Date[] = [];
  const candidate = new Date(desde);
  candidate.setSeconds(0, 0);

  // Avanzar hasta el próximo diaSemana en el futuro
  do {
    candidate.setDate(candidate.getDate() + 1);
  } while (candidate.getDay() !== diaSemana);
  candidate.setHours(h, m, 0, 0);

  for (let i = 0; i < cantidad; i++) {
    result.push(new Date(candidate));
    candidate.setDate(candidate.getDate() + 7);
  }

  return result;
}

/** Genera viajes faltantes para mantener 8 semanas adelante y crea reservas para pasajeros fijos */
export async function generarViajesFaltantes() {
  const SEMANAS_ADELANTE = 8;

  const recurrentes = await prisma.viajeRecurrente.findMany({
    where: { activo: true },
    include: {
      vehiculo: true,
      pasajerosFijos: {
        where: { activo: true },
        select: { userId: true },
      },
    },
  });

  for (const vr of recurrentes) {
    const futuros = await prisma.viaje.count({
      where: { viajeRecurrenteId: vr.id, horarioSalida: { gte: new Date() } },
    });

    const faltantes = SEMANAS_ADELANTE - futuros;
    if (faltantes <= 0) continue;

    const ultimo = await prisma.viaje.findFirst({
      where: { viajeRecurrenteId: vr.id },
      orderBy: { horarioSalida: "desc" },
    });

    const desde = ultimo?.horarioSalida ?? new Date();
    const fechas = proximasOcurrencias(vr.diaSemana, vr.hora, faltantes, desde);

    for (const fecha of fechas) {
      // Crear el viaje con asientos
      const viaje = await prisma.viaje.create({
        data: {
          origen: vr.origen,
          destino: vr.destino,
          horarioSalida: fecha,
          precio: vr.precio,
          vehiculoId: vr.vehiculoId,
          observaciones: vr.observaciones,
          viajeRecurrenteId: vr.id,
          asientos: {
            create: Array.from({ length: vr.vehiculo.capacidad }, (_, i) => ({
              numero: i + 1,
              estado: EstadoAsiento.DISPONIBLE,
            })),
          },
        },
      });

      // Auto-reservar para cada pasajero fijo
      for (const pf of vr.pasajerosFijos) {
        const asiento = await prisma.asiento.findFirst({
          where: { viajeId: viaje.id, estado: EstadoAsiento.DISPONIBLE },
          orderBy: { numero: "asc" },
        });
        if (!asiento) break;

        await prisma.$transaction([
          prisma.reserva.create({
            data: {
              userId: pf.userId,
              viajeId: viaje.id,
              asientoId: asiento.id,
              metodoPago: "EFECTIVO",
              monto: vr.precio,
            },
          }),
          prisma.asiento.update({
            where: { id: asiento.id },
            data: { estado: EstadoAsiento.RESERVADO },
          }),
        ]);
      }
    }
  }
}
