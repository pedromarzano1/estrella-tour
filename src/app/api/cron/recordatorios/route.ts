import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generarViajesFaltantes } from "@/lib/viajes-recurrentes";
import { enviarRecordatorioViaje, enviarAvisoPagoPendiente } from "@/lib/email";
import { timingSafeEqual } from "crypto";

function secretValido(provided: string | null): boolean {
  const expected = process.env.CRON_SECRET;
  if (!provided || !expected) return false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function procesarRecordatoriosViaje(ahora: Date) {
  const en22h = new Date(ahora.getTime() + 22 * 60 * 60 * 1000);
  const en26h = new Date(ahora.getTime() + 26 * 60 * 60 * 1000);

  const reservas = await prisma.reserva.findMany({
    where: {
      estadoReserva: "CONFIRMADA",
      recordatorioEnviado: false,
      viaje: { horarioSalida: { gte: en22h, lte: en26h }, estado: "ACTIVO" },
    },
    include: {
      user: { select: { nombre: true, email: true } },
      viaje: { select: { origen: true, destino: true, horarioSalida: true } },
      asiento: { select: { numero: true } },
    },
  });

  const results = await Promise.allSettled(
    reservas.map((r) =>
      enviarRecordatorioViaje({
        nombre: r.user.nombre,
        email: r.user.email,
        origen: r.viaje.origen,
        destino: r.viaje.destino,
        horarioSalida: r.viaje.horarioSalida,
        asientoNumero: r.asiento.numero,
      }).then(() => r.id)
    )
  );

  const ids = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);

  if (ids.length > 0) {
    await prisma.reserva.updateMany({ where: { id: { in: ids } }, data: { recordatorioEnviado: true } });
  }

  return { enviados: ids.length };
}

async function procesarAvisosPago(ahora: Date) {
  const en22h = new Date(ahora.getTime() + 22 * 60 * 60 * 1000);
  const en26h = new Date(ahora.getTime() + 26 * 60 * 60 * 1000);
  const en10h = new Date(ahora.getTime() + 10 * 60 * 60 * 1000);
  const en14h = new Date(ahora.getTime() + 14 * 60 * 60 * 1000);

  const whereBase = {
    estadoReserva: "CONFIRMADA" as const,
    estadoPago: "PENDIENTE" as const,
  };

  const [pendientes24h, pendientes12h] = await Promise.all([
    prisma.reserva.findMany({
      where: {
        ...whereBase,
        pagoRecordatorio24h: false,
        viaje: { horarioSalida: { gte: en22h, lte: en26h }, estado: "ACTIVO" as const },
      },
      include: {
        user: { select: { nombre: true, email: true } },
        viaje: { select: { origen: true, destino: true, horarioSalida: true } },
      },
    }),
    prisma.reserva.findMany({
      where: {
        ...whereBase,
        pagoRecordatorio12h: false,
        viaje: { horarioSalida: { gte: en10h, lte: en14h }, estado: "ACTIVO" as const },
      },
      include: {
        user: { select: { nombre: true, email: true } },
        viaje: { select: { origen: true, destino: true, horarioSalida: true } },
      },
    }),
  ]);

  const [results24h, results12h] = await Promise.all([
    Promise.allSettled(
      pendientes24h.map((r) =>
        enviarAvisoPagoPendiente({
          nombre: r.user.nombre,
          email: r.user.email,
          origen: r.viaje.origen,
          destino: r.viaje.destino,
          horarioSalida: r.viaje.horarioSalida,
          metodoPago: r.metodoPago,
          ventana: "24h",
        }).then(() => r.id)
      )
    ),
    Promise.allSettled(
      pendientes12h.map((r) =>
        enviarAvisoPagoPendiente({
          nombre: r.user.nombre,
          email: r.user.email,
          origen: r.viaje.origen,
          destino: r.viaje.destino,
          horarioSalida: r.viaje.horarioSalida,
          metodoPago: r.metodoPago,
          ventana: "12h",
        }).then(() => r.id)
      )
    ),
  ]);

  const ids24h = results24h
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);
  const ids12h = results12h
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);

  await Promise.all([
    ids24h.length > 0
      ? prisma.reserva.updateMany({ where: { id: { in: ids24h } }, data: { pagoRecordatorio24h: true } })
      : Promise.resolve(),
    ids12h.length > 0
      ? prisma.reserva.updateMany({ where: { id: { in: ids12h } }, data: { pagoRecordatorio12h: true } })
      : Promise.resolve(),
  ]);

  return { avisosPago24h: ids24h.length, avisosPago12h: ids12h.length };
}

// Llamado por Vercel Cron (vercel.json) o manualmente por el admin
export async function GET(req: NextRequest) {
  if (!secretValido(req.nextUrl.searchParams.get("secret"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();

  const [recordatorios, avisosPago] = await Promise.all([
    procesarRecordatoriosViaje(ahora),
    procesarAvisosPago(ahora),
  ]);

  await generarViajesFaltantes().catch(() => {});

  return NextResponse.json({ ...recordatorios, ...avisosPago });
}
