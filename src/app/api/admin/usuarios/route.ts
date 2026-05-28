import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { enviarBienvenidaAdmin } from "@/lib/email";
import { z } from "zod";

const crearUsuarioSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  telefono: z.string().max(20).optional().or(z.literal("")),
});

export async function GET(req: NextRequest) {
  const admin = await getSessionFromRequest(req);
  if (!admin || admin.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const q = req.nextUrl.searchParams.get("q")?.toLowerCase() ?? "";

  const usuarios = await prisma.user.findMany({
    where: {
      rol: "USUARIO",
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { telefono: { contains: q } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      activo: true,
      creadoEn: true,
      _count: { select: { reservas: true } },
    },
    orderBy: { creadoEn: "desc" },
    take: 100,
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const admin = await getSessionFromRequest(req);
  if (!admin || admin.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = crearUsuarioSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { nombre, email, telefono } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const existe = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existe) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  // Contraseña placeholder — el usuario la define al activar su cuenta
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));

  const user = await prisma.user.create({
    data: { nombre, email: emailNorm, telefono: telefono || null, passwordHash },
    select: { id: true, nombre: true, email: true, telefono: true, creadoEn: true },
  });

  // Token de activación (igual al flujo de reset password)
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usado: false },
    data: { usado: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expira: new Date(Date.now() + 60 * 60 * 1000) },
  });

  await enviarBienvenidaAdmin({
    nombre: user.nombre,
    email: user.email,
    token,
    creadoPor: admin.nombre,
  }).catch(() => {});

  return NextResponse.json({ user }, { status: 201 });
}
