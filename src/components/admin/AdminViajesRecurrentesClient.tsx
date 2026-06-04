"use client";

import { useState } from "react";
import Link from "next/link";
import { Repeat, Users, XCircle, CheckCircle, Edit } from "lucide-react";

interface Recurrente {
  id: string;
  origen: string;
  destino: string;
  diaSemana: number;
  hora: string;
  precio: number;
  activo: boolean;
  vehiculo: { descripcion: string; capacidad: number };
  _count: { viajes: number; pasajerosFijos: number };
}

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function AdminViajesRecurrentesClient({ recurrentes: initial }: { recurrentes: Recurrente[] }) {
  const [lista, setLista] = useState(initial);
  const [cambiando, setCambiando] = useState<string | null>(null);

  async function toggleActivo(id: string, activo: boolean) {
    const accion = activo ? "desactivar" : "activar";
    if (!confirm(activo ? "¿Desactivar esta plantilla? Se eliminará de la lista." : "¿Reactivar esta plantilla? Se volverán a generar viajes.")) return;
    setCambiando(id);

    const res = await fetch("/api/admin/viajes-recurrentes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activo: !activo }),
    });

    if (res.ok) {
      if (activo) {
        setLista((prev) => prev.filter((r) => r.id !== id));
      } else {
        setLista((prev) => prev.map((r) => (r.id === id ? { ...r, activo: true } : r)));
      }
    }
    setCambiando(null);
  }

  if (lista.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <Repeat className="w-4 h-4 text-purple-600" />
        <h2 className="text-lg font-bold text-gray-900">Plantillas de Viajes Fijos</h2>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ruta</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Horario fijo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Vehículo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Precio</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Viajes futuros</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Pasajeros fijos</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lista.map((r) => (
                <tr key={r.id} className={`hover:bg-gray-50 ${!r.activo ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.origen} → {r.destino}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p className="font-semibold">{DIAS[r.diaSemana]}</p>
                    <p className="text-xs">{r.hora} hs</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs truncate max-w-[140px]">
                    {r.vehiculo.descripcion}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    ${r.precio.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge-success">{r._count.viajes} viajes</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-purple-700">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-semibold">{r._count.pasajerosFijos}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={r.activo ? "badge-success" : "badge-gray"}>
                      {r.activo ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/viajes-recurrentes/${r.id}/pasajeros`}
                        className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded"
                        title="Ver pasajeros"
                      >
                        <Users className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/viajes-recurrentes/${r.id}`}
                        className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => toggleActivo(r.id, r.activo)}
                        disabled={cambiando === r.id}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                        title={r.activo ? "Desactivar plantilla" : "Reactivar plantilla"}
                      >
                        {r.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
