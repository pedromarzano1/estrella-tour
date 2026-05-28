import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { enviarBienvenidaEmpleado } from "@/lib/email";
import { z } from "zod";

const crearEmpleadoSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
});

export async function GET(req: NextRequest) {
  const admin = await getSessionFromRequest(req);
  if (!admin || admin.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const empleados = await prisma.user.findMany({
    where: { rol: "ADMIN" },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
      creadoEn: true,
    },
    orderBy: { creadoEn: "asc" },
  });

  return NextResponse.json(empleados);
}

export async function POST(req: NextRequest) {
  const admin = await getSessionFromRequest(req);
  if (!admin || admin.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = crearEmpleadoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
  }

  const { nombre, email } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const existe = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (existe) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  // Contraseña placeholder — el empleado la define al activar su cuenta
  const passwordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));

  const empleado = await prisma.user.create({
    data: { nombre, email: emailNorm, passwordHash, rol: "ADMIN" },
    select: { id: true, nombre: true, email: true, activo: true, creadoEn: true },
  });

  // Token de activación
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: { userId: empleado.id, token, expira: new Date(Date.now() + 60 * 60 * 1000) },
  });

  let emailEnviado = false;
  let emailError: string | null = null;

  try {
    await enviarBienvenidaEmpleado({ nombre: empleado.nombre, email: empleado.email, token });
    emailEnviado = true;
  } catch (err) {
    emailError = err instanceof Error ? err.message : "Error desconocido al enviar el email";
    console.error("[empleados] Error enviando email de activación:", emailError);
  }

  const activationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/olvide-contrasena/nueva?token=${token}`;

  return NextResponse.json({ empleado, emailEnviado, emailError, activationLink }, { status: 201 });
}
