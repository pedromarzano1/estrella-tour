import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { enviarConfirmacionReserva } from "@/lib/email";
import { EstadoAsiento } from "@prisma/client";
import { z } from "zod";

const crearReservaAdminSchema = z.object({
  userId: z.string().min(1),
  viajeId: z.string().min(1),
  asientoId: z.string().min(1),
  esFijo: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await getSessionFromRequest(req);
  if (!admin || admin.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = crearReservaAdminSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { userId, viajeId, asientoId, esFijo } = parsed.data;

  try {
    const reserva = await prisma.$transaction(async (tx) => {
      const viaje = await tx.viaje.findUnique({ where: { id: viajeId } });
      if (!viaje || viaje.estado !== "ACTIVO" || viaje.horarioSalida < new Date()) {
        throw new Error("VIAJE_NO_DISPONIBLE");
      }

      const yaReservado = await tx.reserva.findFirst({
        where: { userId, viajeId, estadoReserva: "CONFIRMADA" },
      });
      if (yaReservado) throw new Error("YA_TIENE_RESERVA");

      const claimed = await tx.asiento.updateMany({
        where: { id: asientoId, viajeId, estado: EstadoAsiento.DISPONIBLE },
        data: { estado: EstadoAsiento.RESERVADO },
      });
      if (claimed.count === 0) throw new Error("ASIENTO_NO_DISPONIBLE");

      return tx.reserva.create({
        data: { userId, viajeId, asientoId, metodoPago: "EFECTIVO", monto: viaje.precio },
        include: { viaje: true, asiento: true, user: { select: { nombre: true, email: true } } },
      });
    });

    // Si es pasajero fijo, registrarlo y crear reservas en viajes futuros
    if (esFijo && reserva.viaje) {
      const viajeConRecurrente = await prisma.viaje.findUnique({
        where: { id: viajeId },
        select: { viajeRecurrenteId: true, horarioSalida: true },
      });
      if (viajeConRecurrente?.viajeRecurrenteId) {
        await prisma.pasajeroFijo.upsert({
          where: { viajeRecurrenteId_userId: { viajeRecurrenteId: viajeConRecurrente.viajeRecurrenteId, userId } },
          create: { viajeRecurrenteId: viajeConRecurrente.viajeRecurrenteId, userId, activo: true },
          update: { activo: true },
        });

        // Crear reservas automáticas en viajes futuros del mismo recurrente
        const viajesFuturos = await prisma.viaje.findMany({
          where: {
            viajeRecurrenteId: viajeConRecurrente.viajeRecurrenteId,
            horarioSalida: { gt: viajeConRecurrente.horarioSalida },
            estado: "ACTIVO",
          },
          include: { asientos: { where: { estado: "DISPONIBLE" }, orderBy: { numero: "asc" } } },
          orderBy: { horarioSalida: "asc" },
        });

        const asientoActual = await prisma.asiento.findUnique({ where: { id: asientoId }, select: { numero: true } });
        const numeroAsiento = asientoActual?.numero ?? 1;

        await Promise.allSettled(
          viajesFuturos.map(async (vf) => {
            const yaReservado = await prisma.reserva.findFirst({
              where: { userId, viajeId: vf.id, estadoReserva: "CONFIRMADA" },
            });
            if (yaReservado) return;

            const asientoMismo = vf.asientos.find((a) => a.numero === numeroAsiento);
            const asientoElegido = asientoMismo ?? vf.asientos[0];
            if (!asientoElegido) return;

            // Transacción atómica por viaje: si falla uno no afecta al resto
            await prisma.$transaction([
              prisma.asiento.update({ where: { id: asientoElegido.id }, data: { estado: EstadoAsiento.RESERVADO } }),
              prisma.reserva.create({
                data: { userId, viajeId: vf.id, asientoId: asientoElegido.id, metodoPago: "EFECTIVO", monto: vf.precio },
              }),
            ]);
          })
        );
      }
    }

    // Email de confirmación al pasajero
    await enviarConfirmacionReserva({
      nombre: reserva.user.nombre,
      email: reserva.user.email,
      origen: reserva.viaje.origen,
      destino: reserva.viaje.destino,
      horarioSalida: reserva.viaje.horarioSalida,
      asientoNumero: reserva.asiento.numero,
      metodoPago: "EFECTIVO",
      monto: reserva.monto,
      reservaId: reserva.id,
    }).then(() =>
      prisma.reserva.update({ where: { id: reserva.id }, data: { emailEnviado: true } })
    ).catch(() => {});

    return NextResponse.json({ reservaId: reserva.id }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    const map: Record<string, [string, number]> = {
      ASIENTO_NO_DISPONIBLE: ["El asiento ya está ocupado", 409],
      VIAJE_NO_DISPONIBLE: ["El viaje no está disponible", 400],
      YA_TIENE_RESERVA: ["El pasajero ya tiene reserva en este viaje", 409],
    };
    const [error, status] = map[msg] ?? ["Error al crear la reserva", 500];
    return NextResponse.json({ error }, { status });
  }
}
