import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { proximasOcurrencias } from "@/lib/viajes-recurrentes";
import { EstadoAsiento } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  origen: z.string().min(2).max(100),
  destino: z.string().min(2).max(100),
  diaSemana: z.number().int().min(0).max(6),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm requerido"),
  precio: z.number().positive(),
  vehiculoId: z.string().min(1),
  observaciones: z.string().max(500).optional(),
  semanas: z.number().int().min(1).max(16).default(8),
});

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { origen, destino, diaSemana, hora, precio, vehiculoId, observaciones, semanas } = parsed.data;

  const vehiculo = await prisma.vehiculo.findUnique({ where: { id: vehiculoId } });
  if (!vehiculo || !vehiculo.activo) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 400 });
  }

  const recurrente = await prisma.viajeRecurrente.create({
    data: { origen, destino, diaSemana, hora, precio, vehiculoId, observaciones },
  });

  const fechas = proximasOcurrencias(diaSemana, hora, semanas);

  await Promise.all(
    fechas.map((fecha) =>
      prisma.viaje.create({
        data: {
          origen,
          destino,
          horarioSalida: fecha,
          precio,
          vehiculoId,
          observaciones,
          viajeRecurrenteId: recurrente.id,
          asientos: {
            create: Array.from({ length: vehiculo.capacidad }, (_, i) => ({
              numero: i + 1,
              estado: EstadoAsiento.DISPONIBLE,
            })),
          },
        },
      })
    )
  );

  return NextResponse.json({ recurrenteId: recurrente.id, viajesCreados: fechas.length }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const recurrentes = await prisma.viajeRecurrente.findMany({
    where: { activo: true },
    include: {
      vehiculo: { select: { descripcion: true, capacidad: true } },
      _count: {
        select: {
          viajes: { where: { horarioSalida: { gte: new Date() } } },
          pasajerosFijos: { where: { activo: true } },
        },
      },
    },
    orderBy: [{ diaSemana: "asc" }, { hora: "asc" }],
  });

  return NextResponse.json(recurrentes);
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id, activo } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const updated = await prisma.viajeRecurrente.update({
    where: { id },
    data: { activo },
  });

  return NextResponse.json(updated);
}
