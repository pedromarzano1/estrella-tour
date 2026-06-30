import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createSession,
  getSessionCookieOptions,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();

  // Capa 1: rate limit por IP (5 intentos/minuto — bloquea ataques simples)
  if (!await rateLimit(getRateLimitKey(ip, "login"), 5, 60_000)) {
    logger.warn("auth.ratelimit", { ip });
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá un minuto." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const emailNorm = email.toLowerCase();

  // Capa 2: rate limit por cuenta (10 intentos/15min — bloquea ataques distribuidos)
  if (!await rateLimit(getRateLimitKey(emailNorm, "login-account"), 10, 900_000)) {
    logger.warn("auth.ratelimit.account", { email: emailNorm });
    return NextResponse.json(
      { error: "Cuenta bloqueada temporalmente por múltiples intentos fallidos. Esperá 15 minutos o usá 'Olvidé mi contraseña'." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (!user || !user.activo) {
    // Tiempo constante para evitar timing attacks
    await verifyPassword(password, "$2a$12$dummy.hash.to.prevent.timing.attacks.ok");
    logger.warn("auth.login.failed", { email: emailNorm, ip, reason: !user ? "not_found" : "inactive" });
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    logger.warn("auth.login.failed", { email: emailNorm, ip, reason: "wrong_password" });
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  logger.info("auth.login.ok", { userId: user.id, ip });
  const token = await createSession(user.id);
  const cookieOpts = getSessionCookieOptions(token);

  const res = NextResponse.json({
    ok: true,
    user: { nombre: user.nombre, rol: user.rol },
  });

  res.cookies.set(cookieOpts);
  res.cookies.set({
    name: "et_rol",
    value: user.rol,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: cookieOpts.maxAge,
    path: "/",
  });

  return res;
}
