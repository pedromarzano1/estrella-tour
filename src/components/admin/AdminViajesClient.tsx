"use client";

import { useState } from "react";
import Link from "next/link";
import { Edit, Users, MapPin, Bus, CheckCircle, XCircle } from "lucide-react";
import { formatearPrecio } from "@/lib/utils";

interface Viaje {
  id: string;
  origen: string;
  destino: string;
  horarioSalida: string;
  precio: number;
  estado: string;
  vehiculo: { descripcion: string; capacidad: number };
  _count: { asientos: number };
}

interface Props {
  viajes: Viaje[];
}

const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: "badge-success",
  CANCELADO: "badge-danger",
  COMPLETADO: "badge-gray",
};

export function AdminViajesClient({ viajes: initial }: Props) {
  const [viajes, setViajes] = useState(initial);
  const [cambiando, setCambiando] = useState<string | null>(null);

  async function toggleEstado(id: string, estadoActual: string) {
    const nuevoEstado = estadoActual === "ACTIVO" ? "CANCELADO" : "ACTIVO";
    if (!confirm(estadoActual === "ACTIVO" ? "¿Cancelar este viaje? Se eliminará de la lista." : "¿Reactivar este viaje?")) return;
    setCambiando(id);

    const res = await fetch(`/api/admin/viajes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    if (res.ok) {
      if (nuevoEstado === "CANCELADO") {
        setViajes((prev) => prev.filter((v) => v.id !== id));
      } else {
        setViajes((prev) => prev.map((v) => (v.id === id ? { ...v, estado: nuevoEstado } : v)));
      }
    }
    setCambiando(null);
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Ruta</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Salida</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Vehículo</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Asientos</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Precio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {viajes.map((v) => {
              const disponibles = v._count.asientos;
              const ocupados = v.vehiculo.capacidad - disponibles;
              const horario = new Date(v.horarioSalida);

              return (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-900">{v.origen}</span>
                      <span className="text-gray-400">→</span>
                      <span className="font-medium text-gray-900">{v.destino}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <p>{new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(horario)}</p>
                    <p className="font-semibold">{new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(horario)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Bus className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[140px]" title={v.vehiculo.descripcion}>{v.vehiculo.descripcion}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">
                      <span className="font-medium text-green-700">{disponibles}</span>
                      <span className="text-gray-400"> disp / </span>
                      <span className="font-medium text-red-600">{ocupados}</span>
                      <span className="text-gray-400"> ocup</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatearPrecio(v.precio)}</td>
                  <td className="px-4 py-3">
                    <span className={ESTADO_COLORS[v.estado] ?? "badge-gray"}>{v.estado}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/viajes/${v.id}/pasajeros`}
                        className="p-1.5 text-gray-400 hover:text-purple-700 hover:bg-purple-50 rounded"
                        title="Ver pasajeros"
                      >
                        <Users className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/viajes/${v.id}`}
                        className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => toggleEstado(v.id, v.estado)}
                        disabled={cambiando === v.id}
                        className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                        title={v.estado === "ACTIVO" ? "Cancelar viaje" : "Reactivar viaje"}
                      >
                        {v.estado === "ACTIVO" ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {viajes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  No hay viajes. <Link href="/admin/viajes/nuevo" className="text-brand-700 underline">Crear el primero</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
