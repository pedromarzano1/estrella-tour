import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

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
        where: { activo: true },
        include: {
          user: { select: { nombre: true, email: true, telefono: true } },
        },
        orderBy: { creadoEn: "asc" },
      },
      _count: {
        select: {
          viajes: { where: { horarioSalida: { gte: new Date() } } },
        },
      },
    },
  });

  if (!recurrente) notFound();

  const pasajeros = recurrente.pasajerosFijos;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/viajes" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total pasajeros fijos", value: pasajeros.length, color: "text-brand-700 bg-brand-50" },
          { label: "Viajes futuros", value: recurrente._count.viajes, color: "text-green-700 bg-green-50" },
          { label: "Con teléfono", value: pasajeros.filter(p => p.user.telefono).length, color: "text-purple-700 bg-purple-50" },
          { label: "Sin teléfono", value: pasajeros.filter(p => !p.user.telefono).length, color: "text-yellow-700 bg-yellow-50" },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <p className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      {pasajeros.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-lg font-medium mb-1">Sin pasajeros fijos</p>
          <p className="text-sm">Todavía no hay pasajeros registrados en esta plantilla.</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Pasajero</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pasajeros.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.user.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">{p.user.email}</td>
                    <td className="px-4 py-3">
                      {p.user.telefono ? (
                        <a
                          href={`https://wa.me/${p.user.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${p.user.nombre}, te contactamos de Estrella Tour.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                        >
                          <WhatsAppIcon className="w-3 h-3" />
                          {p.user.telefono}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Sin teléfono</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
