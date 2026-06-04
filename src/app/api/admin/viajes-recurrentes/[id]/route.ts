import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  origen: z.string().min(2).max(100).optional(),
  destino: z.string().min(2).max(100).optional(),
  diaSemana: z.number().int().min(0).max(6).optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:mm requerido").optional(),
  precio: z.number().positive().optional(),
  vehiculoId: z.string().min(1).optional(),
  observaciones: z.string().max(500).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionFromRequest(req);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;

  const exists = await prisma.viajeRecurrente.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const updated = await prisma.viajeRecurrente.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
