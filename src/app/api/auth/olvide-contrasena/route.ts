import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { enviarResetPassword } from "@/lib/email";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();

  // Rate limit: 3 intentos cada 15 minutos por IP
  if (!await rateLimit(getRateLimitKey(ip, "reset-pass"), 3, 900_000)) {
    return NextResponse.json({ ok: true }); // Respuesta genérica para no revelar el límite
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : null;
  if (!email) return NextResponse.json({ ok: true });

  const user = await prisma.user.findUnique({ where: { email } });

  // Siempre responder igual para no revelar si el email existe
  if (!user || !user.activo) return NextResponse.json({ ok: true });

  // Invalidar tokens anteriores no usados
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usado: false },
    data: { usado: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expira },
  });

  await enviarResetPassword({
    nombre: user.nombre,
    email: user.email,
    token,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
