import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, createSession, getSessionCookieOptions } from "@/lib/auth";
import { registroSchema } from "@/lib/validations";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();

  if (!await rateLimit(getRateLimitKey(ip, "registro"), 3, 300_000)) {
    return NextResponse.json({ error: "Demasiados registros. Esperá 5 minutos." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const { nombre, email, telefono, password } = parsed.data;

  const existe = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existe) {
    return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { nombre, email: email.toLowerCase(), telefono, passwordHash },
  });

  const token = await createSession(user.id);
  const cookieOpts = getSessionCookieOptions(token);

  const res = NextResponse.json({ ok: true });
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
