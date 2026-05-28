import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { cambiarPasswordSchema } from "@/lib/validations";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().length(64),
  passwordNueva: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
    .regex(/[0-9]/, "Debe tener al menos un número"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { token, passwordNueva } = parsed.data;

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.usado || resetToken.expira < new Date()) {
    return NextResponse.json(
      { error: "El enlace es inválido o ya expiró. Solicitá uno nuevo." },
      { status: 400 }
    );
  }

  const hash = await hashPassword(passwordNueva);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash: hash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usado: true } }),
    prisma.session.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  return NextResponse.json({ ok: true });
}
