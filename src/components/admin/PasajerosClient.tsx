"use client";

import { useState } from "react";
import { MessageCircle, CheckCircle } from "lucide-react";

interface Pasajero {
  id: string;
  estadoPago: string;
  metodoPago: string;
  monto: number;
  creadoEn: string;
  user: { nombre: string; email: string; telefono: string | null };
  asientoNumero: number;
  mpPaymentId: string | null;
}

interface Props {
  reservas: Pasajero[];
  viajeId: string;
}

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

export function PasajerosClient({ reservas, viajeId }: Props) {
  const [lista, setLista] = useState(reservas);
  const [marcando, setMarcando] = useState<string | null>(null);

  async function marcarPagado(id: string) {
    setMarcando(id);
    const res = await fetch(`/api/admin/reservas/${id}/marcar-pagado`, { method: "POST" });
    if (res.ok) {
      setLista((prev) => prev.map((r) => (r.id === id ? { ...r, estadoPago: "APROBADO" } : r)));
    }
    setMarcando(null);
  }

  if (lista.length === 0) {
    return (
      <div className="card text-center py-12 text-gray-400">
        <p className="text-lg font-medium mb-1">Sin reservas confirmadas</p>
        <p className="text-sm">Todavía no hay pasajeros en este viaje.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Asiento</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Pasajero</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Contacto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Método</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Monto</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lista.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-bold text-brand-800 text-center text-lg">
                  {r.asientoNumero}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{r.user.nombre}</p>
                  <p className="text-xs text-gray-400">{r.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  {r.user.telefono ? (
                    <a
                      href={`https://wa.me/${r.user.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${r.user.nombre}, te contactamos de Estrella Tour.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                    >
                      <MessageCircle className="w-3 h-3" />
                      {r.user.telefono}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Sin teléfono</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {r.metodoPago === "MERCADO_PAGO" ? "💳 MercadoPago" : "💵 Efectivo"}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">
                  ${r.monto.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3">
                  <span className={BADGE[r.estadoPago] ?? "badge-gray"}>
                    {LABEL[r.estadoPago] ?? r.estadoPago}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {r.estadoPago === "PENDIENTE" && r.metodoPago === "EFECTIVO" && (
                    <button
                      onClick={() => marcarPagado(r.id)}
                      disabled={marcando === r.id}
                      className="flex items-center gap-1 text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      {marcando === r.id ? "Guardando..." : "Marcar pagado"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
