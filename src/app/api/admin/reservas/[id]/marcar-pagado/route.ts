import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { EstadoAsiento } from "@prisma/client";
import { enviarConfirmacionReserva } from "@/lib/email";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionFromRequest(req);
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: {
      asiento: true,
      user: { select: { nombre: true, email: true } },
      viaje: { select: { origen: true, destino: true, horarioSalida: true } },
    },
  });

  if (!reserva) return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  if (reserva.estadoReserva !== "CONFIRMADA") {
    return NextResponse.json({ error: "La reserva no está activa" }, { status: 400 });
  }
  if (reserva.estadoPago === "APROBADO") {
    return NextResponse.json({ error: "Ya está marcada como pagada" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.reserva.update({
      where: { id },
      data: { estadoPago: "APROBADO" },
    }),
    prisma.asiento.update({
      where: { id: reserva.asientoId },
      data: { estado: EstadoAsiento.PAGADO },
    }),
  ]);

  try {
    await enviarConfirmacionReserva({
      nombre: reserva.user.nombre,
      email: reserva.user.email,
      origen: reserva.viaje.origen,
      destino: reserva.viaje.destino,
      horarioSalida: reserva.viaje.horarioSalida,
      asientoNumero: reserva.asiento.numero,
      metodoPago: reserva.metodoPago,
      monto: reserva.monto,
      reservaId: reserva.id,
    });
    logger.info("payment.confirmed_by_admin", { reservaId: id, adminId: user.id, email: reserva.user.email });
  } catch (err) {
    logger.error("payment.confirm_email_failed", { reservaId: id, error: String(err) });
  }

  return NextResponse.json({ ok: true });
}
