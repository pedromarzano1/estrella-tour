import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generarViajesFaltantes } from "@/lib/viajes-recurrentes";
import nodemailer from "nodemailer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const FROM_EMAIL = process.env.GMAIL_USER ?? "reservas@estrellatour.com.ar";

function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    tls: { rejectUnauthorized: false },
  });
}

// Llamado por Vercel Cron (vercel.json) o manualmente por el admin
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const ahora = new Date();
  const en22h = new Date(ahora.getTime() + 22 * 60 * 60 * 1000);
  const en26h = new Date(ahora.getTime() + 26 * 60 * 60 * 1000);

  const reservas = await prisma.reserva.findMany({
    where: {
      estadoReserva: "CONFIRMADA",
      recordatorioEnviado: false,
      viaje: {
        horarioSalida: { gte: en22h, lte: en26h },
        estado: "ACTIVO",
      },
    },
    include: {
      user: { select: { nombre: true, email: true } },
      viaje: { select: { origen: true, destino: true, horarioSalida: true } },
      asiento: { select: { numero: true } },
    },
  });

  if (reservas.length === 0) {
    return NextResponse.json({ enviados: 0 });
  }

  let enviados = 0;
  const ids: string[] = [];

  for (const r of reservas) {
    const fecha = format(r.viaje.horarioSalida, "EEEE d 'de' MMMM", { locale: es });
    const hora = format(r.viaje.horarioSalida, "HH:mm");

    try {
      await createTransporter().sendMail({
        from: `"Estrella Tour" <${FROM_EMAIL}>`,
        to: r.user.email,
        subject: `⏰ Recordatorio: tu viaje mañana a las ${hora}`,
        html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0c4a6e;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:#7dd3fc;margin:8px 0 0;">Recordatorio de viaje</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${r.user.nombre}</strong>,</p>
      <p style="color:#374151;">Te recordamos que <strong>mañana</strong> tenés un viaje programado.</p>

      <div style="background:#eff6ff;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #0ea5e9;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;">Ruta</td><td style="font-weight:600;color:#111827;">${r.viaje.origen} → ${r.viaje.destino}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Fecha</td><td style="font-weight:600;color:#111827;">${fecha}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Hora de salida</td><td style="font-weight:700;color:#0ea5e9;font-size:18px;">${hora} hs</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Asiento</td><td style="font-weight:600;color:#111827;">N° ${r.asiento.numero}</td></tr>
        </table>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:16px;border-left:4px solid #d97706;">
        <p style="margin:0;color:#92400e;font-size:14px;">⚠️ Si necesitás cancelar, tenés tiempo hasta 24 horas antes de la salida. Hacelo desde "Mis Reservas" en nuestra web.</p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Estrella Tour — Más de 16 años conectando Mercedes con Buenos Aires</p>
    </div>
  </div>
</body>
</html>`,
      });
      ids.push(r.id);
      enviados++;
    } catch {
      // continuar con el siguiente si uno falla
    }
  }

  if (ids.length > 0) {
    await prisma.reserva.updateMany({
      where: { id: { in: ids } },
      data: { recordatorioEnviado: true },
    });
  }

  // ── Avisos de pago pendiente ──────────────────────────────────────────────
  const en10h = new Date(ahora.getTime() + 10 * 60 * 60 * 1000);
  const en14h = new Date(ahora.getTime() + 14 * 60 * 60 * 1000);

  const [pendientes24h, pendientes12h] = await Promise.all([
    prisma.reserva.findMany({
      where: {
        estadoReserva: "CONFIRMADA",
        estadoPago: "PENDIENTE",
        metodoPago: "MERCADO_PAGO",
        pagoRecordatorio24h: false,
        viaje: { horarioSalida: { gte: en22h, lte: en26h }, estado: "ACTIVO" },
      },
      include: {
        user: { select: { nombre: true, email: true } },
        viaje: { select: { origen: true, destino: true, horarioSalida: true } },
      },
    }),
    prisma.reserva.findMany({
      where: {
        estadoReserva: "CONFIRMADA",
        estadoPago: "PENDIENTE",
        metodoPago: "MERCADO_PAGO",
        pagoRecordatorio12h: false,
        viaje: { horarioSalida: { gte: en10h, lte: en14h }, estado: "ACTIVO" },
      },
      include: {
        user: { select: { nombre: true, email: true } },
        viaje: { select: { origen: true, destino: true, horarioSalida: true } },
      },
    }),
  ]);

  const ids24h: string[] = [];
  const ids12h: string[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://estrella-tour.vercel.app";

  for (const r of pendientes24h) {
    const hora = format(r.viaje.horarioSalida, "HH:mm");
    const fecha = format(r.viaje.horarioSalida, "d 'de' MMMM", { locale: es });
    try {
      await createTransporter().sendMail({
        from: `"Estrella Tour" <${FROM_EMAIL}>`,
        to: r.user.email,
        subject: `⚠️ Falta abonar tu reserva — viaje mañana ${hora} hs`,
        html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#d97706;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:#fef3c7;margin:8px 0 0;">Pago pendiente</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${r.user.nombre}</strong>,</p>
      <p style="color:#374151;">Tu reserva del <strong>${fecha} a las ${hora} hs</strong> (${r.viaje.origen} → ${r.viaje.destino}) todavía figura como <strong>sin pagar</strong>.</p>
      <p style="color:#374151;">Quedan menos de <strong>24 horas</strong> para el viaje. Abonalo antes de que se cancele automáticamente.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${baseUrl}/mis-reservas" style="background:#d97706;color:#fff;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;text-decoration:none;display:inline-block;">Pagar ahora</a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Estrella Tour — Más de 16 años conectando Mercedes con Buenos Aires</p>
    </div>
  </div>
</body></html>`,
      });
      ids24h.push(r.id);
    } catch { /* continuar */ }
  }

  for (const r of pendientes12h) {
    const hora = format(r.viaje.horarioSalida, "HH:mm");
    const fecha = format(r.viaje.horarioSalida, "d 'de' MMMM", { locale: es });
    try {
      await createTransporter().sendMail({
        from: `"Estrella Tour" <${FROM_EMAIL}>`,
        to: r.user.email,
        subject: `🚨 Último aviso: tu reserva vence en 12 hs — ${hora} hs`,
        html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#dc2626;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:#fca5a5;margin:8px 0 0;">Último aviso de pago</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${r.user.nombre}</strong>,</p>
      <p style="color:#374151;">Tu viaje del <strong>${fecha} a las ${hora} hs</strong> (${r.viaje.origen} → ${r.viaje.destino}) sale en menos de <strong>12 horas</strong> y el pago aún está pendiente.</p>
      <p style="color:#374151;">Si no abonás a la brevedad, tu lugar puede liberarse.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${baseUrl}/mis-reservas" style="background:#dc2626;color:#fff;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;text-decoration:none;display:inline-block;">Pagar ahora</a>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Estrella Tour — Más de 16 años conectando Mercedes con Buenos Aires</p>
    </div>
  </div>
</body></html>`,
      });
      ids12h.push(r.id);
    } catch { /* continuar */ }
  }

  if (ids24h.length > 0) await prisma.reserva.updateMany({ where: { id: { in: ids24h } }, data: { pagoRecordatorio24h: true } });
  if (ids12h.length > 0) await prisma.reserva.updateMany({ where: { id: { in: ids12h } }, data: { pagoRecordatorio12h: true } });

  // Generar viajes faltantes para plantillas recurrentes y auto-reservar pasajeros fijos
  await generarViajesFaltantes().catch(() => {});

  return NextResponse.json({ enviados, avisosPago24h: ids24h.length, avisosPago12h: ids12h.length });
}
