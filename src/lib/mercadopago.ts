import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
  options: { timeout: 5000 },
});

export const preference = new Preference(client);
export const payment = new Payment(client);

export interface CrearPreferenciaParams {
  reservaId: string;
  titulo: string;
  precio: number;
  emailComprador: string;
  nombreComprador: string;
}

export async function crearPreferencia(params: CrearPreferenciaParams) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const res = await preference.create({
    body: {
      items: [
        {
          id: params.reservaId,
          title: params.titulo,
          quantity: 1,
          unit_price: params.precio,
          currency_id: "ARS",
        },
      ],
      payer: {
        email: params.emailComprador,
        name: params.nombreComprador,
      },
      back_urls: {
        success: `${baseUrl}/reserva/confirmacion?status=success&reservaId=${params.reservaId}`,
        failure: `${baseUrl}/reserva/confirmacion?status=failure&reservaId=${params.reservaId}`,
        pending: `${baseUrl}/reserva/confirmacion?status=pending&reservaId=${params.reservaId}`,
      },
      notification_url: `${baseUrl}/api/pagos/webhook`,
      external_reference: params.reservaId,
      expires: true,
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  });

  return res;
}

export async function obtenerPago(paymentId: string) {
  return payment.get({ id: paymentId });
}

export function verificarFirmaWebhook(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null,
  secret: string
): boolean {
  if (!xSignature || !xRequestId || !dataId) return false;

  const parts = xSignature.split(",");
  let ts = "";
  let v1 = "";

  for (const part of parts) {
    const [key, val] = part.split("=");
    if (key?.trim() === "ts") ts = val?.trim() ?? "";
    if (key?.trim() === "v1") v1 = val?.trim() ?? "";
  }

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  return hmac === v1;
}
