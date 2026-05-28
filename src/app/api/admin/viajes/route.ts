import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { crearViajeSchema } from "@/lib/validations";
import { EstadoAsiento } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = crearViajeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { origen, destino, horarioSalida, precio, vehiculoId, observaciones } = parsed.data;

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: vehiculoId } });
  if (!vehiculo || !vehiculo.activo) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 400 });
  }

  const viaje = await prisma.viaje.create({
    data: {
      origen,
      destino,
      horarioSalida: new Date(horarioSalida),
      precio,
      vehiculoId,
      observaciones: observaciones ?? null,
      // Crear asientos automáticamente según la capacidad del vehículo
      asientos: {
        create: Array.from({ length: vehiculo.capacidad }, (_, i) => ({
          numero: i + 1,
          estado: EstadoAsiento.DISPONIBLE,
        })),
      },
    },
  });

  return NextResponse.json(viaje, { status: 201 });
}
