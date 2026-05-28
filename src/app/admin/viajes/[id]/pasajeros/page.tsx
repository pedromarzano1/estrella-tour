import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatearFecha, formatearHora, formatearPrecio } from "@/lib/utils";
import { ArrowLeft, Download, Users, MapPin, Clock } from "lucide-react";
import { PasajerosClient } from "@/components/admin/PasajerosClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PasajerosViajePage({ params }: Props) {
  const { id } = await params;

  const viaje = await prisma.viaje.findUnique({
    where: { id },
    include: {
      vehiculo: true,
      reservas: {
        where: { estadoReserva: "CONFIRMADA" },
        include: {
          user: { select: { nombre: true, email: true, telefono: true } },
          asiento: { select: { numero: true } },
          pago: { select: { mpPaymentId: true, estado: true } },
        },
        orderBy: { asiento: { numero: "asc" } },
      },
    },
  });

  if (!viaje) notFound();

  const serialized = viaje.reservas.map((r) => ({
    id: r.id,
    estadoPago: r.estadoPago,
    metodoPago: r.metodoPago,
    monto: r.monto,
    creadoEn: r.creadoEn.toISOString(),
    user: r.user,
    asientoNumero: r.asiento.numero,
    mpPaymentId: r.pago?.mpPaymentId ?? null,
  }));

  const pagados = viaje.reservas.filter((r) => r.estadoPago === "APROBADO").length;
  const pendientes = viaje.reservas.filter((r) => r.estadoPago === "PENDIENTE").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/viajes" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Pasajeros del Viaje</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {viaje.origen} → {viaje.destino}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatearFecha(viaje.horarioSalida)} — {formatearHora(viaje.horarioSalida)}
            </span>
          </div>
        </div>
        <a
          href={`/api/admin/viajes/${id}/pasajeros/excel`}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </a>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total reservas", value: viaje.reservas.length, color: "text-brand-700 bg-brand-50" },
          { label: "Pagados", value: pagados, color: "text-green-700 bg-green-50" },
          { label: "Pendientes", value: pendientes, color: "text-yellow-700 bg-yellow-50" },
          { label: "Ingresos confirmados", value: formatearPrecio(viaje.reservas.filter(r => r.estadoPago === "APROBADO").reduce((s, r) => s + r.monto, 0)), color: "text-purple-700 bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <PasajerosClient reservas={serialized} viajeId={id} />
    </div>
  );
}
