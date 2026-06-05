"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

interface Reserva {
  id: string;
  estadoReserva: string;
  estadoPago: string;
  metodoPago: string;
  monto: number;
  creadoEn: string;
  canceladaEn: string | null;
  user: { nombre: string; email: string; telefono: string | null };
  viaje: { origen: string; destino: string; horarioSalida: string };
  asiento: { numero: number };
  pago: { mpPaymentId: string | null; estado: string } | null;
}

interface Props {
  reservas: Reserva[];
  filtroActivo?: string;
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

export function AdminReservasClient({ reservas, filtroActivo }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [marcando, setMarcando] = useState<string | null>(null);
  const [lista, setLista] = useState(reservas);

  const filtradas = lista.filter((r) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      r.user.nombre.toLowerCase().includes(q) ||
      r.user.email.toLowerCase().includes(q) ||
      r.viaje.origen.toLowerCase().includes(q) ||
      r.viaje.destino.toLowerCase().includes(q) ||
      r.id.includes(q)
    );
  });

  async function marcarPagado(id: string) {
    setMarcando(id);
    const res = await fetch(`/api/admin/reservas/${id}/marcar-pagado`, { method: "POST" });
    if (res.ok) {
      setLista((prev) => prev.map((r) => r.id === id ? { ...r, estadoPago: "APROBADO" } : r));
    }
    setMarcando(null);
  }

  async function cancelarReserva(id: string) {
    if (!confirm("¿Cancelar esta reserva? (Admin puede cancelar sin restricción de 24h)")) return;
    setCancelando(id);

    const res = await fetch(`/api/reservas/${id}/cancelar`, { method: "POST" });
    if (res.ok) {
      setLista((prev) => prev.filter((r) => r.id !== id));
    }
    setCancelando(null);
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Buscar por pasajero, email o ruta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {[
            { label: "Todas", key: undefined },
            { label: "Pendientes", key: "pendiente" },
            { label: "Pagadas", key: "aprobado" },
          ].map((f) => (
            <button
              key={String(f.key)}
              onClick={() => router.push(`/admin/reservas${f.key ? `?filtro=${f.key}` : ""}`)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroActivo === f.key
                  ? "bg-brand-700 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">{filtradas.length} reservas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Pasajero</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Viaje</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Asiento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Método</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Monto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Estado Pago</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.user.nombre}</p>
                    <p className="text-xs text-gray-400">{r.user.email}</p>
                    {r.user.telefono && (
                      <a
                        href={`https://wa.me/${r.user.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${r.user.nombre}, te contactamos de Estrella Tour sobre tu reserva.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-green-600 flex items-center gap-1 mt-0.5 hover:underline"
                      >
                        <WhatsAppIcon className="w-3 h-3" />
                        {r.user.telefono}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700">{r.viaje.origen} → {r.viaje.destino}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">
                      {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(r.viaje.horarioSalida))}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(r.viaje.horarioSalida))}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-700">N° {r.asiento.numero}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {r.metodoPago === "MERCADO_PAGO" ? "💳 MercadoPago" : "💵 Efectivo"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    ${r.monto.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={BADGE[r.estadoPago] ?? "badge-gray"}>
                      {LABEL[r.estadoPago] ?? r.estadoPago}
                    </span>
                    {r.pago?.mpPaymentId && (
                      <p className="text-xs text-gray-400 mt-1 font-mono">MP: {r.pago.mpPaymentId}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      {r.estadoPago === "PENDIENTE" && r.metodoPago === "EFECTIVO" && (
                        <button
                          onClick={() => marcarPagado(r.id)}
                          disabled={marcando === r.id}
                          className="flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {marcando === r.id ? "Guardando..." : "Marcar pagado"}
                        </button>
                      )}
                      {r.estadoReserva === "CONFIRMADA" && (
                        <button
                          onClick={() => cancelarReserva(r.id)}
                          disabled={cancelando === r.id}
                          className="text-xs text-red-600 hover:text-red-800 hover:underline font-medium"
                        >
                          {cancelando === r.id ? "Cancelando..." : "Cancelar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-400">Sin resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
