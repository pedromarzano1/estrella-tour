import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { puedeCancel } from "@/lib/utils";
import { enviarCancelacionReserva } from "@/lib/email";
import { EstadoAsiento } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: {
      viaje: true,
      asiento: true,
      user: { select: { nombre: true, email: true } },
    },
  });

  if (!reserva) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });

  // Solo el dueño de la reserva puede cancelarla (o un admin)
  if (reserva.userId !== user.id && user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (reserva.estadoReserva === "CANCELADA") {
    return NextResponse.json({ error: "La reserva ya está cancelada" }, { status: 400 });
  }

  if (!puedeCancel(reserva.viaje.horarioSalida) && user.rol !== "ADMIN") {
    return NextResponse.json(
      { error: "Solo podés cancelar hasta 24 horas antes del viaje" },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.reserva.update({
      where: { id },
      data: { estadoReserva: "CANCELADA", canceladaEn: new Date() },
    }),
    prisma.asiento.update({
      where: { id: reserva.asientoId },
      data: { estado: EstadoAsiento.DISPONIBLE },
    }),
  ]);

  // Enviar email de cancelación al pasajero (no al admin que ejecuta la acción)
  await enviarCancelacionReserva({
    nombre: reserva.user.nombre,
    email: reserva.user.email,
    origen: reserva.viaje.origen,
    destino: reserva.viaje.destino,
    horarioSalida: reserva.viaje.horarioSalida,
    asientoNumero: reserva.asiento.numero,
    reservaId: reserva.id,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
