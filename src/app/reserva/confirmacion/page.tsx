import Link from "next/link";
import { CheckCircle, XCircle, Clock, Star, ArrowRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatearFecha, formatearHora, formatearPrecio } from "@/lib/utils";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EstadoAsiento } from "@prisma/client";
import { enviarConfirmacionReserva } from "@/lib/email";

interface Props {
  searchParams: Promise<{ status?: string; reservaId?: string }>;
}

export default async function ConfirmacionPage({ searchParams }: Props) {
  const { status, reservaId } = await searchParams;
  const user = await getSession();

  let reserva = null;
  let viajesRegreso: { id: string; origen: string; destino: string; horarioSalida: Date; precio: number }[] = [];

  if (reservaId) {
    reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { viaje: true, asiento: true },
    });
  }

  // Si MP redirige con success y el email no fue enviado aún → enviar confirmación
  if (status === "success" && reserva && !reserva.emailEnviado) {
    const reservaConDatos = await prisma.reserva.findUnique({
      where: { id: reserva.id },
      include: { viaje: true, asiento: true, user: true },
    });
    if (reservaConDatos) {
      await enviarConfirmacionReserva({
        nombre: reservaConDatos.user.nombre,
        email: reservaConDatos.user.email,
        origen: reservaConDatos.viaje.origen,
        destino: reservaConDatos.viaje.destino,
        horarioSalida: reservaConDatos.viaje.horarioSalida,
        asientoNumero: reservaConDatos.asiento.numero,
        metodoPago: "MERCADO_PAGO",
        monto: reservaConDatos.monto,
        reservaId: reservaConDatos.id,
      }).catch(() => {});
      await prisma.reserva.update({ where: { id: reserva.id }, data: { emailEnviado: true } }).catch(() => {});
    }
  }

  // Buscar viajes de regreso si el pago fue exitoso
  if ((status === "success" || status === "efectivo") && reserva && user) {
    const en3dias = new Date(reserva.viaje.horarioSalida.getTime() + 3 * 24 * 60 * 60 * 1000);
    viajesRegreso = await prisma.viaje.findMany({
      where: {
        estado: "ACTIVO",
        origen: reserva.viaje.destino,
        destino: reserva.viaje.origen,
        horarioSalida: { gte: reserva.viaje.horarioSalida, lte: en3dias },
        asientos: { some: { estado: "DISPONIBLE" } },
        reservas: { none: { userId: user.id, estadoReserva: "CONFIRMADA" } },
      },
      select: { id: true, origen: true, destino: true, horarioSalida: true, precio: true },
      orderBy: { horarioSalida: "asc" },
      take: 3,
    });
  }

  // Si el pago falló y la reserva sigue activa → cancelarla y liberar el asiento
  if (status === "failure" && reserva && reserva.estadoReserva === "CONFIRMADA") {
    await prisma.$transaction([
      prisma.reserva.update({
        where: { id: reserva.id },
        data: { estadoReserva: "CANCELADA", canceladaEn: new Date() },
      }),
      prisma.asiento.update({
        where: { id: reserva.asientoId },
        data: { estado: EstadoAsiento.DISPONIBLE },
      }),
    ]).catch(() => {});
  }

  const config = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-500",
      bg: "bg-green-50",
      border: "border-green-200",
      title: "¡Pago confirmado!",
      subtitle: "Tu reserva fue procesada exitosamente.",
    },
    efectivo: {
      icon: CheckCircle,
      iconColor: "text-brand-600",
      bg: "bg-brand-50",
      border: "border-brand-200",
      title: "¡Reserva confirmada!",
      subtitle: "Tu asiento está reservado. Recordá pasar por la oficina a abonar.",
    },
    pending: {
      icon: Clock,
      iconColor: "text-yellow-500",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      title: "Pago en proceso",
      subtitle: "Tu pago está siendo procesado. Te avisamos por email cuando se confirme.",
    },
    failure: {
      icon: XCircle,
      iconColor: "text-red-500",
      bg: "bg-red-50",
      border: "border-red-200",
      title: "Pago no procesado",
      subtitle: "El asiento fue liberado. Podés volver a intentarlo o elegir pago en efectivo.",
    },
  };

  const current = config[status as keyof typeof config] ?? config.pending;
  const Icon = current.icon;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user ? { nombre: user.nombre, rol: user.rol } : null} />

      <main className="flex-1 flex items-center justify-center bg-gray-50 py-16 px-4">
        <div className="max-w-lg w-full">
          <div className={`card border ${current.border} text-center`}>
            <div className={`w-20 h-20 ${current.bg} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <Icon className={`w-10 h-10 ${current.iconColor}`} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">{current.title}</h1>
            <p className="text-gray-500 mb-6">{current.subtitle}</p>

            {reserva && status !== "failure" && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Detalle de tu reserva:</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Viaje</span>
                    <span className="font-medium">{reserva.viaje.origen} → {reserva.viaje.destino}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Asiento</span>
                    <span className="font-medium">N° {reserva.asiento.numero}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Método de pago</span>
                    <span className="font-medium">
                      {reserva.metodoPago === "MERCADO_PAGO" ? "Mercado Pago" : "Efectivo"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Código</span>
                    <span className="font-mono text-xs">{reserva.id.slice(0, 12)}...</span>
                  </div>
                </div>
              </div>
            )}

            {(status === "success" || status === "efectivo") && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-6 text-left">
                <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Política de cancelaciones</p>
                <p className="text-sm text-amber-700">
                  Recordá que tenés <strong>24 horas antes de la salida del servicio</strong> para cancelar o cambiar de horario. Pasadas esas 24 hs no se realizan devoluciones.
                </p>
              </div>
            )}

            {status !== "failure" && (
              <p className="text-sm text-gray-400 mb-6 flex items-center justify-center gap-1">
                <Star className="w-4 h-4" />
                Revisá tu email — te mandamos todos los detalles.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {status === "failure" && reserva ? (
                <Link href={`/reservar/${reserva.viaje.id}`} className="btn-primary text-center">
                  Volver a intentar
                </Link>
              ) : (
                <Link href="/mis-reservas" className="btn-primary text-center">
                  Ver mis reservas
                </Link>
              )}
              <Link href="/viajes" className="btn-secondary text-center">
                Ver más viajes
              </Link>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-3">¿Necesitás ayuda?</p>
              <a
                href="https://wa.me/542324504000"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
              >
                <WhatsAppIcon className="w-4 h-4" />
                Escribinos por WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Sugerencia de regreso */}
        {viajesRegreso.length > 0 && (
          <div className="max-w-lg w-full mt-6">
            <div className="card border border-brand-200">
              <h2 className="font-bold text-brand-900 mb-1 text-lg">¿También reservás el regreso?</h2>
              <p className="text-sm text-gray-500 mb-4">
                Encontramos viajes de <strong>{reserva!.viaje.destino}</strong> a <strong>{reserva!.viaje.origen}</strong> disponibles:
              </p>
              <div className="space-y-3">
                {viajesRegreso.map((v) => (
                  <Link
                    key={v.id}
                    href={`/reservar/${v.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-brand-400 hover:bg-brand-50 transition-all group"
                  >
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{formatearFecha(v.horarioSalida)}</p>
                      <p className="text-xs text-gray-500">{formatearHora(v.horarioSalida)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-800">{formatearPrecio(v.precio)}</span>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-brand-700 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
