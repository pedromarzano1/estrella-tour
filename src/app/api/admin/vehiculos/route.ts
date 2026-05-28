import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, isAdmin } from "@/lib/auth";
import { crearVehiculo } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user || !isAdmin(user)) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = crearVehiculo.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const existe = await prisma.vehiculo.findUnique({ where: { patente: parsed.data.patente } });
  if (existe) return NextResponse.json({ error: "Esa patente ya existe" }, { status: 409 });

  const vehiculo = await prisma.vehiculo.create({ data: parsed.data });
  return NextResponse.json(vehiculo, { status: 201 });
}
