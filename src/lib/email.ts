import nodemailer from "nodemailer";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const FROM_NAME = "Estrella Tour";
const FROM_EMAIL = process.env.GMAIL_USER ?? process.env.FROM_EMAIL ?? "reservas@estrellatour.com.ar";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

let _transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      tls: { rejectUnauthorized: false },
    });
  }
  return _transporter;
}

async function sendMail(options: { to: string; subject: string; html: string }) {
  await getTransporter().sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

interface DatosReserva {
  nombre: string;
  email: string;
  origen: string;
  destino: string;
  horarioSalida: Date;
  asientoNumero: number;
  metodoPago: string;
  monto: number;
  reservaId: string;
}

export async function enviarConfirmacionReserva(datos: DatosReserva) {
  const fecha = format(datos.horarioSalida, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const hora = format(datos.horarioSalida, "HH:mm", { locale: es });
  const metodoPagoLabel = datos.metodoPago === "MERCADO_PAGO" ? "Mercado Pago" : "En la oficina";
  const nombre = escapeHtml(datos.nombre);
  const origen = escapeHtml(datos.origen);
  const destino = escapeHtml(datos.destino);

  await sendMail({
    to: datos.email,
    subject: `Confirmación de reserva — ${origen} → ${destino}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Confirmación de Reserva</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1e3a8a;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:#93c5fd;margin:8px 0 0;">Confirmación de Reserva</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#374151;">Tu reserva fue confirmada exitosamente. Guardá este email con los datos de tu viaje.</p>

      <div style="background:#eff6ff;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #1e3a8a;">
        <h2 style="color:#1e3a8a;margin:0 0 16px;font-size:18px;">Datos del Viaje</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;">Desde</td><td style="padding:6px 0;color:#111827;font-weight:600;">${origen}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Hasta</td><td style="padding:6px 0;color:#111827;font-weight:600;">${destino}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Fecha</td><td style="padding:6px 0;color:#111827;font-weight:600;">${fecha}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Horario de salida</td><td style="padding:6px 0;color:#111827;font-weight:600;">${hora} hs</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Asiento N°</td><td style="padding:6px 0;color:#111827;font-weight:600;">${datos.asientoNumero}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Método de pago</td><td style="padding:6px 0;color:#111827;font-weight:600;">${metodoPagoLabel}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Total</td><td style="padding:6px 0;color:#1e3a8a;font-weight:700;font-size:18px;">$${datos.monto.toLocaleString("es-AR")}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Código de reserva</td><td style="padding:6px 0;color:#111827;font-family:monospace;font-size:13px;">${datos.reservaId}</td></tr>
        </table>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #d97706;">
        <p style="margin:0;color:#92400e;font-size:14px;"><strong>⚠️ Cancelaciones:</strong> Podés cancelar tu reserva hasta 24 horas antes de la salida del viaje desde "Mis Reservas" en nuestra web.</p>
      </div>

      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;">
        <p style="color:#374151;font-size:14px;"><strong>¿Necesitás ayuda?</strong></p>
        <p style="color:#6b7280;font-size:14px;">Comunicáte con nosotros por WhatsApp:</p>
        <p style="font-size:14px;">
          📱 <a href="https://wa.me/542324504000" style="color:#1e3a8a;">2324-504000</a> &nbsp;|&nbsp;
          <a href="https://wa.me/542324560139" style="color:#1e3a8a;">2324-560139</a> &nbsp;|&nbsp;
          <a href="https://wa.me/541122663000" style="color:#1e3a8a;">11-22663000</a>
        </p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Estrella Tour — Más de 16 años conectando Mercedes con Buenos Aires</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function enviarAsientoReservadoPendientePago(datos: Omit<DatosReserva, "metodoPago">) {
  const fecha = format(datos.horarioSalida, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const hora = format(datos.horarioSalida, "HH:mm", { locale: es });
  const nombre = escapeHtml(datos.nombre);
  const origen = escapeHtml(datos.origen);
  const destino = escapeHtml(datos.destino);

  await sendMail({
    to: datos.email,
    subject: `Tu asiento está guardado — ${origen} → ${destino}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Asiento Reservado</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#1e3a8a;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:#93c5fd;margin:8px 0 0;">Asiento Guardado — Pago Pendiente</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#374151;">Tu asiento quedó <strong>reservado</strong>. Para confirmar tu lugar, acercate a abonar en nuestra oficina.</p>

      <div style="background:#eff6ff;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #1e3a8a;">
        <h2 style="color:#1e3a8a;margin:0 0 16px;font-size:18px;">Datos del Viaje</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;">Desde</td><td style="padding:6px 0;color:#111827;font-weight:600;">${origen}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Hasta</td><td style="padding:6px 0;color:#111827;font-weight:600;">${destino}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Fecha</td><td style="padding:6px 0;color:#111827;font-weight:600;">${fecha}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Horario de salida</td><td style="padding:6px 0;color:#111827;font-weight:600;">${hora} hs</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Asiento N°</td><td style="padding:6px 0;color:#111827;font-weight:600;">${datos.asientoNumero}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Total a abonar</td><td style="padding:6px 0;color:#1e3a8a;font-weight:700;font-size:18px;">$${datos.monto.toLocaleString("es-AR")}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Código de reserva</td><td style="padding:6px 0;color:#111827;font-family:monospace;font-size:13px;">${datos.reservaId}</td></tr>
        </table>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #d97706;">
        <p style="margin:0;color:#92400e;font-size:14px;"><strong>⚠️ Recordá:</strong> Tu lugar queda reservado, pero necesitás pasar a abonar en nuestra oficina para confirmar definitivamente el viaje. Una vez que registremos tu pago, te llegará un email de confirmación.</p>
      </div>

      <div style="margin-top:24px;padding-top:24px;border-top:1px solid #e5e7eb;">
        <p style="color:#374151;font-size:14px;"><strong>¿Necesitás ayuda o querés cancelar?</strong></p>
        <p style="color:#6b7280;font-size:14px;">Comunicáte con nosotros por WhatsApp:</p>
        <p style="font-size:14px;">
          📱 <a href="https://wa.me/542324504000" style="color:#1e3a8a;">2324-504000</a> &nbsp;|&nbsp;
          <a href="https://wa.me/542324560139" style="color:#1e3a8a;">2324-560139</a> &nbsp;|&nbsp;
          <a href="https://wa.me/541122663000" style="color:#1e3a8a;">11-22663000</a>
        </p>
      </div>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Estrella Tour — Más de 16 años conectando Mercedes con Buenos Aires</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function enviarCancelacionReserva(datos: Omit<DatosReserva, "metodoPago" | "monto">) {
  const fecha = format(datos.horarioSalida, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
  const hora = format(datos.horarioSalida, "HH:mm", { locale: es });
  const nombre = escapeHtml(datos.nombre);
  const origen = escapeHtml(datos.origen);
  const destino = escapeHtml(datos.destino);

  await sendMail({
    to: datos.email,
    subject: `Cancelación de reserva — ${origen} → ${destino}`,
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Cancelación de Reserva</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#dc2626;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:#fca5a5;margin:8px 0 0;">Cancelación de Reserva</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#374151;">Tu reserva fue cancelada exitosamente.</p>
      <div style="background:#fef2f2;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #dc2626;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;">Viaje cancelado</td><td style="padding:6px 0;color:#111827;font-weight:600;">${origen} → ${destino}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Fecha</td><td style="padding:6px 0;color:#111827;font-weight:600;">${fecha} — ${hora} hs</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Asiento</td><td style="padding:6px 0;color:#111827;font-weight:600;">N° ${datos.asientoNumero}</td></tr>
        </table>
      </div>
      <p style="color:#374151;font-size:14px;">Si pagaste por Mercado Pago, el reintegro se procesará según los tiempos de MP. Si tenés dudas, escribinos por WhatsApp.</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function enviarBienvenidaEmpleado(datos: {
  nombre: string;
  email: string;
  token: string;
}) {
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/olvide-contrasena/nueva?token=${datos.token}`;
  const nombre = escapeHtml(datos.nombre);
  const email = escapeHtml(datos.email);

  await sendMail({
    to: datos.email,
    subject: "Tu acceso al panel de Estrella Tour",
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0f172a;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:#94a3b8;margin:8px 0 0;">Panel de Administración</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#374151;">Se creó una cuenta de empleado para vos en el sistema de Estrella Tour. Vas a poder gestionar viajes, reservas y pasajeros desde el panel.</p>

      <div style="background:#f0f9ff;border-radius:8px;padding:20px;margin:24px 0;border-left:4px solid #0ea5e9;">
        <p style="margin:0 0 6px;color:#374151;"><strong>Tu email de acceso:</strong> ${email}</p>
        <p style="margin:0;color:#6b7280;font-size:14px;">Usá este email para ingresar al panel.</p>
      </div>

      <p style="color:#374151;">Hacé clic para crear tu contraseña y acceder:</p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${link}" style="background:#0f172a;color:#fff;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;text-decoration:none;display:inline-block;">
          Activar mi cuenta
        </a>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:16px;border-left:4px solid #d97706;">
        <p style="margin:0;color:#92400e;font-size:14px;">⚠️ Este enlace es válido por <strong>1 hora</strong>. Si no podés activar tu cuenta, pedile al administrador que la reenvíe.</p>
      </div>

      <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
        Si el botón no funciona, copiá este enlace:<br/>
        <a href="${link}" style="color:#0284c7;word-break:break-all;">${link}</a>
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Estrella Tour — Panel interno de administración</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function enviarBienvenidaAdmin(datos: {
  nombre: string;
  email: string;
  token: string;
  creadoPor: string;
}) {
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/olvide-contrasena/nueva?token=${datos.token}`;
  const nombre = escapeHtml(datos.nombre);
  const email = escapeHtml(datos.email);

  await sendMail({
    to: datos.email,
    subject: "Tu cuenta en Estrella Tour está lista",
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0c4a6e;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:#7dd3fc;margin:8px 0 0;">¡Bienvenido/a!</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#374151;">El equipo de Estrella Tour creó una cuenta para vos. Ya podés acceder al sistema para ver tus reservas y viajar más fácil.</p>

      <div style="background:#eff6ff;border-radius:8px;padding:20px;margin:24px 0;border-left:4px solid #0ea5e9;">
        <p style="margin:0 0 8px;color:#374151;"><strong>Tu email de acceso:</strong> ${email}</p>
        <p style="margin:0;color:#6b7280;font-size:14px;">Usá este email para iniciar sesión.</p>
      </div>

      <p style="color:#374151;">Para crear tu contraseña y activar tu cuenta, hacé clic acá:</p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${link}" style="background:#0284c7;color:#fff;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;text-decoration:none;display:inline-block;">
          Activar mi cuenta
        </a>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:16px;border-left:4px solid #d97706;">
        <p style="margin:0;color:#92400e;font-size:14px;">⚠️ Este enlace es válido por <strong>1 hora</strong>.</p>
      </div>

      <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
        Si el botón no funciona, copiá este enlace:<br/>
        <a href="${link}" style="color:#0284c7;word-break:break-all;">${link}</a>
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Estrella Tour — Más de 16 años conectando Mercedes con Buenos Aires</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function enviarResetPassword(datos: { nombre: string; email: string; token: string }) {
  const link = `${process.env.NEXT_PUBLIC_BASE_URL}/olvide-contrasena/nueva?token=${datos.token}`;
  const nombre = escapeHtml(datos.nombre);

  await sendMail({
    to: datos.email,
    subject: "Restablecer contraseña — Estrella Tour",
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Restablecer contraseña</title></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:#0c4a6e;padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:#7dd3fc;margin:8px 0 0;">Restablecer contraseña</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#374151;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón para crear una nueva:</p>

      <div style="text-align:center;margin:32px 0;">
        <a href="${link}" style="background:#0284c7;color:#fff;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;text-decoration:none;display:inline-block;">
          Restablecer contraseña
        </a>
      </div>

      <div style="background:#fef3c7;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #d97706;">
        <p style="margin:0;color:#92400e;font-size:14px;">
          ⚠️ Este enlace es válido por <strong>1 hora</strong>. Si no solicitaste el cambio, ignorá este email.
        </p>
      </div>

      <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
        Si el botón no funciona, copiá este enlace en tu navegador:<br/>
        <a href="${link}" style="color:#0284c7;word-break:break-all;">${link}</a>
      </p>
    </div>
    <div style="background:#f9fafb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Estrella Tour — Más de 16 años conectando Mercedes con Buenos Aires</p>
    </div>
  </div>
</body>
</html>`,
  });
}

export async function enviarNotificacionAdminPagoRecibido(datos: {
  reservaId: string;
  nombrePasajero: string;
  emailPasajero: string;
  origen: string;
  destino: string;
  horario: Date;
  asientoNumero: number;
  monto: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) throw new Error("ADMIN_EMAIL env var no configurada");
  const fecha = format(datos.horario, "dd/MM/yyyy HH:mm", { locale: es });
  const nombrePasajero = escapeHtml(datos.nombrePasajero);
  const emailPasajero = escapeHtml(datos.emailPasajero);
  const origen = escapeHtml(datos.origen);
  const destino = escapeHtml(datos.destino);

  await sendMail({
    to: adminEmail,
    subject: `✅ Pago recibido — ${nombrePasajero} — ${origen} → ${destino}`,
    html: `
<p>Pago aprobado por Mercado Pago.</p>
<ul>
  <li><strong>Pasajero:</strong> ${nombrePasajero} (${emailPasajero})</li>
  <li><strong>Viaje:</strong> ${origen} → ${destino}</li>
  <li><strong>Fecha/Hora:</strong> ${fecha}</li>
  <li><strong>Asiento:</strong> N° ${datos.asientoNumero}</li>
  <li><strong>Monto:</strong> $${datos.monto.toLocaleString("es-AR")}</li>
  <li><strong>ID Reserva:</strong> ${datos.reservaId}</li>
</ul>`,
  });
}

export async function enviarRecordatorioViaje(datos: {
  nombre: string;
  email: string;
  origen: string;
  destino: string;
  horarioSalida: Date;
  asientoNumero: number;
}) {
  const fecha = format(datos.horarioSalida, "EEEE d 'de' MMMM", { locale: es });
  const hora = format(datos.horarioSalida, "HH:mm");
  const nombre = escapeHtml(datos.nombre);
  const origen = escapeHtml(datos.origen);
  const destino = escapeHtml(datos.destino);

  await sendMail({
    to: datos.email,
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
      <p style="color:#374151;font-size:16px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#374151;">Te recordamos que <strong>mañana</strong> tenés un viaje programado.</p>
      <div style="background:#eff6ff;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #0ea5e9;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;">Ruta</td><td style="font-weight:600;color:#111827;">${origen} → ${destino}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Fecha</td><td style="font-weight:600;color:#111827;">${fecha}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Hora de salida</td><td style="font-weight:700;color:#0ea5e9;font-size:18px;">${hora} hs</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;">Asiento</td><td style="font-weight:600;color:#111827;">N° ${datos.asientoNumero}</td></tr>
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
}

export async function enviarAvisoPagoPendiente(datos: {
  nombre: string;
  email: string;
  origen: string;
  destino: string;
  horarioSalida: Date;
  metodoPago: string;
  ventana: "24h" | "12h";
}) {
  const hora = format(datos.horarioSalida, "HH:mm");
  const fecha = format(datos.horarioSalida, "d 'de' MMMM", { locale: es });
  const nombre = escapeHtml(datos.nombre);
  const origen = escapeHtml(datos.origen);
  const destino = escapeHtml(datos.destino);
  const esEfectivo = datos.metodoPago === "EFECTIVO";
  const es24h = datos.ventana === "24h";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://estrella-tour.vercel.app";

  const headerColor = es24h ? "#d97706" : "#dc2626";
  const subtitleColor = es24h ? "#fef3c7" : "#fca5a5";
  const subject = es24h
    ? `⚠️ Falta abonar tu reserva — viaje mañana ${hora} hs`
    : `🚨 Último aviso: tu reserva vence en 12 hs — ${hora} hs`;
  const cuerpo = es24h
    ? `Tu reserva del <strong>${fecha} a las ${hora} hs</strong> (${origen} → ${destino}) todavía figura como <strong>sin pagar</strong>. Quedan menos de <strong>24 horas</strong> para el viaje.`
    : `Tu viaje del <strong>${fecha} a las ${hora} hs</strong> (${origen} → ${destino}) sale en menos de <strong>12 horas</strong> y el pago aún está pendiente.`;
  const cta = esEfectivo
    ? `<p style="color:#374151;">${es24h ? "Acercate a nuestra oficina para abonar antes del viaje." : "Acercate a nuestra oficina a la brevedad para no perder tu lugar."}</p>`
    : `<div style="text-align:center;margin:32px 0;"><a href="${baseUrl}/mis-reservas" style="background:${headerColor};color:#fff;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;text-decoration:none;display:inline-block;">Pagar ahora</a></div>`;

  await sendMail({
    to: datos.email,
    subject,
    html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f7fb;margin:0;padding:0;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:${headerColor};padding:32px 40px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">⭐ Estrella Tour</h1>
      <p style="color:${subtitleColor};margin:8px 0 0;">${es24h ? "Pago pendiente" : "Último aviso de pago"}</p>
    </div>
    <div style="padding:40px;">
      <p style="color:#374151;font-size:16px;">Hola <strong>${nombre}</strong>,</p>
      <p style="color:#374151;">${cuerpo}</p>
      ${cta}
    </div>
    <div style="background:#f9fafb;padding:16px 40px;text-align:center;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">Estrella Tour — Más de 16 años conectando Mercedes con Buenos Aires</p>
    </div>
  </div>
</body></html>`,
  });
}
