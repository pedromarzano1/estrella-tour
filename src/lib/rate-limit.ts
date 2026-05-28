import { prisma } from "./db";

export async function rateLimit(key: string, maxAttempts: number, windowMs: number): Promise<boolean> {
  const now = new Date();

  // Limpiar entradas expiradas ocasionalmente (1% de las requests, sin bloquear)
  if (Math.random() < 0.01) {
    prisma.rateLimitEntry.deleteMany({ where: { resetAt: { lt: now } } }).catch(() => {});
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimitEntry.findUnique({ where: { key } });

      if (!existing || existing.resetAt < now) {
        await tx.rateLimitEntry.upsert({
          where: { key },
          create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
          update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
        });
        return true;
      }

      if (existing.count >= maxAttempts) return false;

      await tx.rateLimitEntry.update({
        where: { key },
        data: { count: { increment: 1 } },
      });
      return true;
    });

    return result;
  } catch {
    // Si la DB falla, permitir la request (fail open) para no bloquear el sistema
    return true;
  }
}

export function getRateLimitKey(identifier: string, action: string): string {
  return `${action}:${identifier}`;
}
