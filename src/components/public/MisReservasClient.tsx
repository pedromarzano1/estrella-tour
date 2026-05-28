"use client";

import { useState } from "react";
import { MapPin, Clock, Bus, CreditCard, Banknote, AlertTriangle, Calendar, CheckCircle, X } from "lucide-react";
import Link from "next/link";
import { formatearFecha, formatearHora, formatearPrecio, puedeCancel } from "@/lib/utils";

interface Reserva {
  id: string;
  estadoReserva: string;
  estadoPago: string;
  metodoPago: string;
  monto: number;
  creadoEn: string;
  canceladaEn: string | null;
  viaje: {
    id: string;
    origen: string;
    destino: string;
    horarioSalida: string;
    vehiculo: { descripcion: string };
  };
  asiento: { numero: number };
  pago: { estado: string; mpPaymentId?: string | null } | null;
}

interface Props {
  reservas: Reserva[];
}

const ESTADO_PAGO_BADGE: Record<string, string> = {
  APROBADO: "badge-success",
  PENDIENTE: "badge-warning",
  EN_PROCESO: "badge-blue",
  RECHAZADO: "badge-danger",
};

const ESTADO_PAGO_LABEL: Record<string, string> = {
  APROBADO: "✅ Pagado",
  PENDIENTE: "⏳ Pendiente",
  EN_PROCESO: "🔄 En proceso",
  RECHAZADO: "❌ Rechazado",
};

export function MisReservasClient({ reservas }: Props) {
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lista, setLista] = useState(reservas);

  const activas = lista.filter((r) => r.estadoReserva === "CONFIRMADA");
  const canceladas = lista.filter((r) => r.estadoReserva === "CANCELADA");

  async function handleCancelar(id: string) {
    if (!confirm("¿Estás seguro de que querés cancelar esta reserva?")) return;
    setCancelando(id);
    setError(null);

    const res = await fetch(`/api/reservas/${id}/cancelar`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al cancelar");
    } else {
      setLista((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, estadoReserva: "CANCELADA", canceladaEn: new Date().toISOString() } : r
        )
      );
    }
    setCancelando(null);
  }

  if (lista.length === 0) {
    return (
      <div className="text-center py-16">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Todavía no tenés reservas</h2>
        <p className="text-gray-400 mb-6">Explorá los viajes disponibles y reservá tu asiento.</p>
        <Link href="/viajes" className="btn-primary inline-block">Ver Viajes</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {activas.length > 0 && (
        <div>
          <h2 className="font-bold text-xl text-gray-900 mb-4">Reservas Activas ({activas.length})</h2>
          <div className="grid gap-4">
            {activas.map((r) => {
              const horario = new Date(r.viaje.horarioSalida);
              const puedeElCancel = puedeCancel(horario);
              const esEfectivo = r.metodoPago === "EFECTIVO";

              return (
                <div key={r.id} className="card hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Info viaje */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
                        <span className="font-bold text-brand-900">{r.viaje.origen}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-bold text-brand-900">{r.viaje.destino}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>{formatearFecha(horario)} — {formatearHora(horario)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Bus className="w-4 h-4 flex-shrink-0" />
                        <span>{r.viaje.vehiculo.descripcion}</span>
                      </div>

                      <div className="flex flex-wrap gap-3 items-center">
                        <span className="text-sm font-medium text-gray-700">
                          Asiento N° <strong>{r.asiento.numero}</strong>
                        </span>
                        <span className="text-sm font-bold text-brand-800">{formatearPrecio(r.monto)}</span>
                        {esEfectivo ? (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Banknote className="w-3 h-3" /> En la oficina
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <CreditCard className="w-3 h-3" /> Mercado Pago
                          </span>
                        )}
                        <span className={ESTADO_PAGO_BADGE[r.estadoPago] ?? "badge-gray"}>
                          {ESTADO_PAGO_LABEL[r.estadoPago] ?? r.estadoPago}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      {puedeElCancel ? (
                        <button
                          onClick={() => handleCancelar(r.id)}
                          disabled={cancelando === r.id}
                          className="btn-danger text-sm py-2 px-4 flex items-center justify-center gap-2"
                        >
                          {cancelando === r.id ? "Cancelando..." : "Cancelar"}
                        </button>
                      ) : (
                        <div className="text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-2">
                          <AlertTriangle className="w-3 h-3 inline mr-1" />
                          No se puede cancelar (menos de 24h)
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {canceladas.length > 0 && (
        <div>
          <h2 className="font-bold text-xl text-gray-500 mb-4">Reservas Canceladas</h2>
          <div className="grid gap-3">
            {canceladas.map((r) => (
              <div key={r.id} className="card opacity-60 bg-gray-50">
                <div className="flex items-center gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-700">
                      {r.viaje.origen} → {r.viaje.destino}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatearFecha(new Date(r.viaje.horarioSalida))} — Asiento {r.asiento.numero}
                    </p>
                  </div>
                  <span className="ml-auto badge-danger">Cancelada</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
