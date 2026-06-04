import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowLeft, MapPin, Clock, Users } from "lucide-react";
import { formatearFecha, formatearHora } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const dynamic = "force-dynamic";

export default async function PasajerosRecurrentePage({ params }: Props) {
  const { id } = await params;

  const recurrente = await prisma.viajeRecurrente.findUnique({
    where: { id },
    include: {
      pasajerosFijos: {
        include: {
          user: { select: { nombre: true, email: true, telefono: true } },
        },
        orderBy: { creadoEn: "asc" },
      },
      viajes: {
        where: { horarioSalida: { gte: new Date() } },
        include: {
          _count: {
            select: {
              reservas: { where: { estadoReserva: "CONFIRMADA" } },
              asientos: { where: { estado: "DISPONIBLE" } },
            },
          },
        },
        orderBy: { horarioSalida: "asc" },
        take: 8,
      },
    },
  });

  if (!recurrente) notFound();

  const activos = recurrente.pasajerosFijos.filter((p) => p.activo);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/viajes" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pasajeros Fijos</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {recurrente.origen} → {recurrente.destino}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {DIAS[recurrente.diaSemana]} — {recurrente.hora} hs
            </span>
          </div>
        </div>
      </div>

      {/* Pasajeros fijos */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-purple-600" />
          <h2 className="font-bold text-gray-900">Pasajeros fijos registrados ({activos.length})</h2>
        </div>

        {activos.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">Sin pasajeros fijos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Pasajero</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Email</th>
                  <th className="text-left py-2 font-medium text-gray-500">Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {activos.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{p.user.nombre}</td>
                    <td className="py-3 pr-4 text-gray-500">{p.user.email}</td>
                    <td className="py-3 text-gray-500">{p.user.telefono ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Próximos viajes */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">Próximos viajes generados</h2>

        {recurrente.viajes.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">Sin viajes futuros programados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Fecha</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Hora</th>
                  <th className="text-left py-2 pr-4 font-medium text-gray-500">Reservas</th>
                  <th className="text-left py-2 font-medium text-gray-500">Disponibles</th>
                </tr>
              </thead>
              <tbody>
                {recurrente.viajes.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 pr-4 font-medium text-gray-900">{formatearFecha(v.horarioSalida)}</td>
                    <td className="py-3 pr-4 text-gray-600">{formatearHora(v.horarioSalida)}</td>
                    <td className="py-3 pr-4">
                      <span className="text-brand-700 font-semibold">{v._count.reservas}</span>
                    </td>
                    <td className="py-3">
                      <span className={`font-semibold ${v._count.asientos === 0 ? "text-red-600" : "text-green-700"}`}>
                        {v._count.asientos}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
