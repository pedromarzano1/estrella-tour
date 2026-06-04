import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowLeft, MapPin, Clock, Download, Users, Repeat } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatearFecha, formatearHora } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const dynamic = "force-dynamic";

const BADGE: Record<string, string> = {
  APROBADO: "badge-success",
  PENDIENTE: "badge-warning",
  EN_PROCESO: "badge-blue",
  RECHAZADO: "badge-danger",
};
const LABEL: Record<string, string> = {
  APROBADO: "✅ Pagado",
  PENDIENTE: "⏳ Pendiente",
  EN_PROCESO: "🔄 En proceso",
  RECHAZADO: "❌ Rechazado",
};

export default async function PasajerosRecurrentePage({ params }: Props) {
  const { id } = await params;

  const recurrente = await prisma.viajeRecurrente.findUnique({
    where: { id },
    include: {
      pasajerosFijos: {
        where: { activo: true },
        include: { user: { select: { nombre: true, email: true, telefono: true } } },
      },
      viajes: {
        where: { horarioSalida: { gte: new Date() } },
        include: {
          reservas: {
            where: { estadoReserva: "CONFIRMADA" },
            include: {
              user: { select: { nombre: true, email: true, telefono: true } },
              asiento: { select: { numero: true } },
            },
            orderBy: { asiento: { numero: "asc" } },
          },
        },
        orderBy: { horarioSalida: "asc" },
        take: 8,
      },
      _count: {
        select: {
          viajes: { where: { horarioSalida: { gte: new Date() } } },
          pasajerosFijos: { where: { activo: true } },
        },
      },
    },
  });

  if (!recurrente) notFound();

  const totalReservas = recurrente.viajes.reduce((s, v) => s + v.reservas.length, 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/viajes" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Pasajeros del Viaje Fijo</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{recurrente.origen} → {recurrente.destino}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{DIAS[recurrente.diaSemana]} — {recurrente.hora} hs</span>
          </div>
        </div>
        <a href={`/api/admin/viajes-recurrentes/${id}/pasajeros/excel`} className="btn-primary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" />
          Exportar Excel
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pasajeros fijos", value: recurrente._count.pasajerosFijos, color: "text-purple-700 bg-purple-50" },
          { label: "Viajes futuros", value: recurrente._count.viajes, color: "text-green-700 bg-green-50" },
          { label: "Reservas activas", value: totalReservas, color: "text-brand-700 bg-brand-50" },
          { label: "Con teléfono", value: recurrente.pasajerosFijos.filter(p => p.user.telefono).length, color: "text-yellow-700 bg-yellow-50" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pasajeros fijos */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Repeat className="w-4 h-4 text-purple-600" />
          <h2 className="font-bold text-gray-900">Pasajeros fijos ({recurrente._count.pasajerosFijos})</h2>
        </div>
        {recurrente.pasajerosFijos.length === 0 ? (
          <p className="text-gray-400 text-sm py-2 text-center">Sin pasajeros fijos registrados.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recurrente.pasajerosFijos.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{p.user.nombre}</p>
                  <p className="text-xs text-gray-400">{p.user.email}</p>
                </div>
                {p.user.telefono ? (
                  <a href={`https://wa.me/${p.user.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${p.user.nombre}, te contactamos de Estrella Tour.`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                    <WhatsAppIcon className="w-3 h-3" />{p.user.telefono}
                  </a>
                ) : (
                  <span className="text-xs text-gray-400">Sin teléfono</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Próximos viajes con sus pasajeros */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-700" />
          <h2 className="font-bold text-gray-900">Próximos viajes</h2>
        </div>

        {recurrente.viajes.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">Sin viajes futuros programados.</div>
        ) : (
          recurrente.viajes.map((viaje) => (
            <div key={viaje.id} className="card overflow-hidden p-0">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{formatearFecha(viaje.horarioSalida)} — {formatearHora(viaje.horarioSalida)}</p>
                </div>
                <span className={`text-xs font-semibold ${viaje.reservas.length === 0 ? "text-gray-400" : "text-brand-700"}`}>
                  {viaje.reservas.length} pasajero{viaje.reservas.length !== 1 ? "s" : ""}
                </span>
              </div>

              {viaje.reservas.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">Sin reservas confirmadas.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Asiento</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Pasajero</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Contacto</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Pago</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {viaje.reservas.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-bold text-brand-800 text-center">{r.asiento.numero}</td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-gray-900">{r.user.nombre}</p>
                          <p className="text-xs text-gray-400">{r.user.email}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          {r.user.telefono ? (
                            <a href={`https://wa.me/${r.user.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${r.user.nombre}, te contactamos de Estrella Tour.`)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-green-600 hover:underline">
                              <WhatsAppIcon className="w-3 h-3" />{r.user.telefono}
                            </a>
                          ) : <span className="text-xs text-gray-400">Sin teléfono</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={BADGE[r.estadoPago] ?? "badge-gray"}>{LABEL[r.estadoPago] ?? r.estadoPago}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
