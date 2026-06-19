import { NextRequest } from "next/server";
import { prisma } from "./db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { Rol } from "@prisma/client";

const SESSION_COOKIE = "et_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 días

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const expira = new Date(Date.now() + SESSION_DURATION);
  const session = await prisma.session.create({
    data: { userId, expira },
  });
  return session.token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expira < new Date()) {
    if (session) await prisma.session.delete({ where: { token } });
    return null;
  }

  return session.user;
}

export async function getSessionFromRequest(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expira < new Date()) {
    if (session) prisma.session.delete({ where: { token } }).catch(() => {});
    return null;
  }
  return session.user;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
}

export function getSessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  };
}

export function isAdmin(user: { rol: Rol } | null): boolean {
  return user?.rol === Rol.ADMIN;
}
