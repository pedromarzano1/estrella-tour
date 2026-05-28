import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  descripcion: z.string().min(2).optional(),
  capacidad: z.number().int().min(1).max(100).optional(),
  activo: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionFromRequest(req);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const vehiculo = await prisma.vehiculo.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!vehiculo) return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });

  return NextResponse.json(vehiculo);
}
