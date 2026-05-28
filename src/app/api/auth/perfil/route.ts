import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, hashPassword, verifyPassword } from "@/lib/auth";
import { actualizarPerfilSchema, cambiarPasswordSchema } from "@/lib/validations";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  // Cambio de contraseña
  if (body.passwordActual !== undefined) {
    // Rate limit: 5 intentos por hora por usuario
    if (!await rateLimit(getRateLimitKey(user.id, "cambio-pass"), 5, 3_600_000)) {
      return NextResponse.json({ error: "Demasiados intentos. Esperá una hora." }, { status: 429 });
    }

    const parsed = cambiarPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const userConPass = await prisma.user.findUnique({ where: { id: user.id } });
    if (!userConPass) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    const ok = await verifyPassword(parsed.data.passwordActual, userConPass.passwordHash);
    if (!ok) return NextResponse.json({ error: "La contraseña actual no es correcta" }, { status: 400 });

    const hash = await hashPassword(parsed.data.passwordNueva);

    // Actualizar contraseña e invalidar TODAS las sesiones activas
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
    ]);

    const res = NextResponse.json({ ok: true, logout: true });
    res.cookies.delete("et_session");
    res.cookies.delete("et_rol");
    return res;
  }

  // Actualizar datos personales
  const parsed = actualizarPerfilSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      nombre: parsed.data.nombre,
      telefono: parsed.data.telefono || null,
    },
    select: { id: true, nombre: true, email: true, telefono: true, rol: true },
  });

  return NextResponse.json({ user: updated });
}
