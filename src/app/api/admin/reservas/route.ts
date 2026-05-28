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
      const asiento = await tx.asiento.findUnique({ where: { id: asientoId } });
      if (!asiento || asiento.estado !== EstadoAsiento.DISPONIBLE || asiento.viajeId !== viajeId) {
        throw new Error("ASIENTO_NO_DISPONIBLE");
      }

      const viaje = await tx.viaje.findUnique({ where: { id: viajeId } });
      if (!viaje || viaje.estado !== "ACTIVO" || viaje.horarioSalida < new Date()) {
        throw new Error("VIAJE_NO_DISPONIBLE");
      }

      const yaReservado = await tx.reserva.findFirst({
        where: { userId, viajeId, estadoReserva: "CONFIRMADA" },
      });
      if (yaReservado) throw new Error("YA_TIENE_RESERVA");

      await tx.asiento.update({ where: { id: asientoId }, data: { estado: EstadoAsiento.RESERVADO } });

      return tx.reserva.create({
        data: { userId, viajeId, asientoId, metodoPago: "EFECTIVO", monto: viaje.precio },
        include: { viaje: true, asiento: true, user: { select: { nombre: true, email: true } } },
      });
    });

    // Si es pasajero fijo, registrarlo en el recurrente correspondiente
    if (esFijo && reserva.viaje) {
      const viajeConRecurrente = await prisma.viaje.findUnique({
        where: { id: viajeId },
        select: { viajeRecurrenteId: true },
      });
      if (viajeConRecurrente?.viajeRecurrenteId) {
        await prisma.pasajeroFijo.upsert({
          where: {
            viajeRecurrenteId_userId: {
              viajeRecurrenteId: viajeConRecurrente.viajeRecurrenteId,
              userId,
            },
          },
          create: {
            viajeRecurrenteId: viajeConRecurrente.viajeRecurrenteId,
            userId,
            activo: true,
          },
          update: { activo: true },
        });
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
