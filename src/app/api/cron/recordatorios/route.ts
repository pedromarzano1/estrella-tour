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

  // Generar viajes faltantes para plantillas recurrentes y auto-reservar pasajeros fijos
  await generarViajesFaltantes().catch(() => {});

  return NextResponse.json({ enviados });
}
