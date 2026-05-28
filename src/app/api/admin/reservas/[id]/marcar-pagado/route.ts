import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { EstadoAsiento } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionFromRequest(req);
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const reserva = await prisma.reserva.findUnique({
    where: { id },
    include: { asiento: true },
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

  return NextResponse.json({ ok: true });
}
