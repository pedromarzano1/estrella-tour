import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSessionFromRequest(req);
  if (!admin || admin.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const recurrente = await prisma.viajeRecurrente.findUnique({ where: { id } });
  if (!recurrente) {
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
  }

  // Cancelar todos los viajes futuros activos de esta plantilla
  const resultado = await prisma.viaje.updateMany({
    where: {
      viajeRecurrenteId: id,
      estado: "ACTIVO",
      horarioSalida: { gte: new Date() },
    },
    data: { estado: "CANCELADO" },
  });

  return NextResponse.json({ cancelados: resultado.count });
}
