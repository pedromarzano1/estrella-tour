import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyPassword,
  createSession,
  getSessionCookieOptions,
} from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();

  if (!await rateLimit(getRateLimitKey(ip, "login"), 5, 60_000)) {
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

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !user.activo) {
    // Tiempo constante para evitar timing attacks
    await verifyPassword(password, "$2a$12$dummy.hash.to.prevent.timing.attacks.ok");
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

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
    sameSite: "lax",
    maxAge: cookieOpts.maxAge,
    path: "/",
  });

  return res;
}
