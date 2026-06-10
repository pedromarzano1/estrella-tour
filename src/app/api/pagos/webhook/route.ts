import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { obtenerPago, verificarFirmaWebhook } from "@/lib/mercadopago";
import { enviarConfirmacionReserva, enviarNotificacionAdminPagoRecibido } from "@/lib/email";
import { EstadoAsiento } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  const url = new URL(req.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  // Verificar firma del webhook — se rechaza si el secret no está configurado
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret || secret.startsWith("REEMPLAZAR")) {
    console.error("MP_WEBHOOK_SECRET no configurado — webhook rechazado");
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 503 });
  }
  if (!verificarFirmaWebhook(xSignature, xRequestId, dataId, secret)) {
    logger.warn("webhook.invalid_signature", { dataId, xRequestId });
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Loguear webhook para auditoría
  await prisma.webhookLog.create({
    data: { tipo: body.type ?? "unknown", payload: body },
  }).catch(() => {});

  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentId = String(body.data.id);

  try {
    const mpPago = await obtenerPago(paymentId);

    const reservaId = mpPago.external_reference;
    if (!reservaId) return NextResponse.json({ ok: true });

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { viaje: true, asiento: true, user: true },
    });
    if (!reserva) return NextResponse.json({ ok: true });

    const estadoMp = mpPago.status;

    await prisma.$transaction(async (tx) => {
      // Actualizar o crear registro de pago
      await tx.pago.upsert({
        where: { reservaId },
        create: {
          reservaId,
          mpPaymentId: paymentId,
          monto: mpPago.transaction_amount ?? reserva.monto,
          estado: estadoMp ?? "unknown",
          rawData: body as object,
        },
        update: {
          mpPaymentId: paymentId,
          estado: estadoMp ?? "unknown",
          rawData: body as object,
        },
      });

      if (estadoMp === "approved") {
        await tx.reserva.update({
          where: { id: reservaId },
          data: {
            estadoPago: "APROBADO",
            mpPaymentId: paymentId,
          },
        });
        await tx.asiento.update({
          where: { id: reserva.asientoId },
          data: { estado: EstadoAsiento.PAGADO },
        });
        logger.info("payment.approved", { reservaId, paymentId, monto: mpPago.transaction_amount });
      } else if (estadoMp === "rejected") {
        await tx.reserva.update({
          where: { id: reservaId },
          data: { estadoPago: "RECHAZADO", estadoReserva: "CANCELADA", canceladaEn: new Date() },
        });
        await tx.asiento.update({
          where: { id: reserva.asientoId },
          data: { estado: EstadoAsiento.DISPONIBLE },
        });
        logger.warn("payment.rejected", { reservaId, paymentId });
      } else if (estadoMp === "in_process" || estadoMp === "pending") {
        await tx.reserva.update({
          where: { id: reservaId },
          data: { estadoPago: "EN_PROCESO" },
        });
      }
    });

    // Enviar email de confirmación si pago aprobado y no enviado aún
    if (estadoMp === "approved" && !reserva.emailEnviado) {
      await enviarConfirmacionReserva({
        nombre: reserva.user.nombre,
        email: reserva.user.email,
        origen: reserva.viaje.origen,
        destino: reserva.viaje.destino,
        horarioSalida: reserva.viaje.horarioSalida,
        asientoNumero: reserva.asiento.numero,
        metodoPago: "MERCADO_PAGO",
        monto: reserva.monto,
        reservaId: reserva.id,
      }).catch(() => {});

      await enviarNotificacionAdminPagoRecibido({
        reservaId: reserva.id,
        nombrePasajero: reserva.user.nombre,
        emailPasajero: reserva.user.email,
        origen: reserva.viaje.origen,
        destino: reserva.viaje.destino,
        horario: reserva.viaje.horarioSalida,
        asientoNumero: reserva.asiento.numero,
        monto: reserva.monto,
      }).catch(() => {});

      await prisma.reserva.update({ where: { id: reservaId }, data: { emailEnviado: true } }).catch(() => {});
    }
  } catch (err) {
    logger.error("webhook.error", { paymentId, error: err instanceof Error ? err.message : String(err) });
    await prisma.webhookLog.updateMany({
      where: { payload: { path: ["data", "id"], equals: paymentId } },
      data: { error: String(err) },
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
