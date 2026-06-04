import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";
import { enviarBienvenidaEmpleado } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSessionFromRequest(req);
  if (!admin || admin.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const empleado = await prisma.user.findUnique({ where: { id, rol: "ADMIN" } });
  if (!empleado) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  // Cambiar contraseña
  if (body.nuevaContrasena) {
    if (typeof body.nuevaContrasena !== "string" || body.nuevaContrasena.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }
    const passwordHash = await hashPassword(body.nuevaContrasena);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    await prisma.session.deleteMany({ where: { userId: id } });
    return NextResponse.json({ ok: true, accion: "contrasena_cambiada" });
  }

  // Reenviar email de activación
  if (body.reenviarActivacion) {
    await prisma.passwordResetToken.updateMany({
      where: { userId: id, usado: false },
      data: { usado: true },
    });
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { userId: id, token, expira: new Date(Date.now() + 60 * 60 * 1000) },
    });
    let emailEnviado = false;
    let emailError: string | null = null;
    try {
      await enviarBienvenidaEmpleado({ nombre: empleado.nombre, email: empleado.email, token });
      emailEnviado = true;
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Error al enviar el email";
      console.error("[empleados] Error reenviando email:", emailError);
    }

    const activationLink = `${process.env.NEXT_PUBLIC_BASE_URL}/olvide-contrasena/nueva?token=${token}`;
    return NextResponse.json({ ok: true, accion: "email_reenviado", emailEnviado, emailError, activationLink });
  }

  // No permitir que un admin se desactive a sí mismo
  if (id === admin.id) {
    return NextResponse.json({ error: "No podés desactivar tu propia cuenta" }, { status: 400 });
  }

  // Activar / desactivar
  const updated = await prisma.user.update({
    where: { id },
    data: { activo: !empleado.activo },
    select: { id: true, activo: true },
  });

  // Si se desactiva, cerrar todas sus sesiones
  if (!updated.activo) {
    await prisma.session.deleteMany({ where: { userId: id } });
  }

  return NextResponse.json({ empleado: updated });
}
