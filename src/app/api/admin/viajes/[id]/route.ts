import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  origen: z.string().min(2).optional(),
  destino: z.string().min(2).optional(),
  horarioSalida: z.string().optional(),
  precio: z.number().positive().optional(),
  vehiculoId: z.string().optional(),
  observaciones: z.string().optional().nullable(),
  estado: z.enum(["ACTIVO", "CANCELADO", "COMPLETADO"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionFromRequest(req);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.horarioSalida) {
    data.horarioSalida = new Date(parsed.data.horarioSalida);
  }

  const viaje = await prisma.viaje.update({ where: { id }, data }).catch(() => null);
  if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });

  return NextResponse.json(viaje);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionFromRequest(req);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;

  // Solo cancelar, no borrar (mantener auditoría)
  await prisma.viaje.update({ where: { id }, data: { estado: "CANCELADO" } });

  return NextResponse.json({ ok: true });
}
