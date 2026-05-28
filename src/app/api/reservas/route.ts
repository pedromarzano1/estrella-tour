import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { crearReservaSchema } from "@/lib/validations";
import { crearPreferencia } from "@/lib/mercadopago";
import { enviarConfirmacionReserva } from "@/lib/email";
import { EstadoAsiento } from "@prisma/client";
import { rateLimit, getRateLimitKey } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Rate limit: máximo 10 reservas por hora por usuario
  if (!await rateLimit(getRateLimitKey(user.id, "reserva"), 10, 3_600_000)) {
    return NextResponse.json({ error: "Demasiadas reservas en poco tiempo. Intentá más tarde." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = crearReservaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { viajeId, asientoId, metodoPago } = parsed.data;

  // Transacción atómica para evitar doble reserva del mismo asiento
  try {
    const reserva = await prisma.$transaction(async (tx) => {
      // Cancelar reserva MP pendiente anterior del mismo usuario en este viaje
      // (cubre el caso donde el usuario volvió atrás sin completar el pago)
      const reservaMPPendiente = await tx.reserva.findFirst({
        where: {
          userId: user.id,
          viajeId,
          estadoReserva: "CONFIRMADA",
          metodoPago: "MERCADO_PAGO",
          estadoPago: "PENDIENTE",
        },
      });
      if (reservaMPPendiente) {
        await tx.reserva.update({
          where: { id: reservaMPPendiente.id },
          data: { estadoReserva: "CANCELADA", canceladaEn: new Date() },
        });
        await tx.asiento.update({
          where: { id: reservaMPPendiente.asientoId },
          data: { estado: EstadoAsiento.DISPONIBLE },
        });
      }

      // Bloquear y verificar asiento
      const asiento = await tx.asiento.findUnique({ where: { id: asientoId } });
      if (!asiento || asiento.estado !== EstadoAsiento.DISPONIBLE) {
        throw new Error("ASIENTO_NO_DISPONIBLE");
      }
      if (asiento.viajeId !== viajeId) {
        throw new Error("ASIENTO_INVALIDO");
      }

      // Verificar viaje activo y futuro
      const viaje = await tx.viaje.findUnique({ where: { id: viajeId } });
      if (!viaje || viaje.estado !== "ACTIVO" || viaje.horarioSalida < new Date()) {
        throw new Error("VIAJE_NO_DISPONIBLE");
      }

      // Verificar que el usuario no tenga ya una reserva activa en este viaje
      const reservaExistente = await tx.reserva.findFirst({
        where: {
          userId: user.id,
          viajeId,
          estadoReserva: "CONFIRMADA",
        },
      });
      if (reservaExistente) {
        throw new Error("YA_TIENE_RESERVA");
      }

      // Marcar asiento como reservado
      await tx.asiento.update({
        where: { id: asientoId },
        data: { estado: EstadoAsiento.RESERVADO },
      });

      // Crear reserva
      const nueva = await tx.reserva.create({
        data: {
          userId: user.id,
          viajeId,
          asientoId,
          metodoPago,
          monto: viaje.precio,
        },
        include: { viaje: true, asiento: true },
      });

      return nueva;
    });

    // Si elige Mercado Pago, crear preferencia
    if (metodoPago === "MERCADO_PAGO") {
      // Verificar que las credenciales de MP estén configuradas
      if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.startsWith("REEMPLAZAR")) {
        // Limpiar la reserva y liberar el asiento
        await prisma.$transaction([
          prisma.reserva.update({ where: { id: reserva.id }, data: { estadoReserva: "CANCELADA", canceladaEn: new Date() } }),
          prisma.asiento.update({ where: { id: asientoId }, data: { estado: EstadoAsiento.DISPONIBLE } }),
        ]);
        return NextResponse.json(
          { error: "El pago con Mercado Pago no está configurado aún. Elegí pago en efectivo o contactanos por WhatsApp." },
          { status: 503 }
        );
      }

      try {
        const pref = await crearPreferencia({
          reservaId: reserva.id,
          titulo: `Estrella Tour — ${reserva.viaje.origen} → ${reserva.viaje.destino}`,
          precio: reserva.monto,
          emailComprador: user.email,
          nombreComprador: user.nombre,
        });

        await prisma.reserva.update({
          where: { id: reserva.id },
          data: { mpPreferenceId: pref.id },
        });

        return NextResponse.json({ reservaId: reserva.id, checkoutUrl: pref.init_point });
      } catch (mpErr) {
        // Si MP falla, cancelar la reserva y liberar el asiento
        await prisma.$transaction([
          prisma.reserva.update({ where: { id: reserva.id }, data: { estadoReserva: "CANCELADA", canceladaEn: new Date() } }),
          prisma.asiento.update({ where: { id: asientoId }, data: { estado: EstadoAsiento.DISPONIBLE } }),
        ]);
        console.error("MercadoPago error:", mpErr);
        return NextResponse.json(
          { error: "Error al conectar con Mercado Pago. Intentá de nuevo o elegí pago en efectivo." },
          { status: 502 }
        );
      }
    }

    // Si es efectivo, enviar email de confirmación (sin bloquear si falla)
    await enviarConfirmacionReserva({
      nombre: user.nombre,
      email: user.email,
      origen: reserva.viaje.origen,
      destino: reserva.viaje.destino,
      horarioSalida: reserva.viaje.horarioSalida,
      asientoNumero: reserva.asiento.numero,
      metodoPago: "EFECTIVO",
      monto: reserva.monto,
      reservaId: reserva.id,
    }).then(() =>
      prisma.reserva.update({ where: { id: reserva.id }, data: { emailEnviado: true } })
    ).catch(() => {});

    return NextResponse.json({ reservaId: reserva.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "ERROR";
    const errorMap: Record<string, [string, number]> = {
      ASIENTO_NO_DISPONIBLE: ["El asiento ya fue reservado por otro usuario", 409],
      ASIENTO_INVALIDO: ["Asiento inválido para este viaje", 400],
      VIAJE_NO_DISPONIBLE: ["El viaje no está disponible", 400],
      YA_TIENE_RESERVA: ["Ya tenés una reserva en este viaje", 409],
    };
    const [errorMsg, status] = errorMap[message] ?? ["Error al crear la reserva", 500];
    return NextResponse.json({ error: errorMsg }, { status });
  }
}

// GET — reservas del usuario autenticado
export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const reservas = await prisma.reserva.findMany({
    where: { userId: user.id },
    include: {
      viaje: { include: { vehiculo: true } },
      asiento: true,
      pago: true,
    },
    orderBy: { creadoEn: "desc" },
  });

  return NextResponse.json(reservas);
}
