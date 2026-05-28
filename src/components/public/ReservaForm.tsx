"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Banknote, MessageCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { EstadoAsiento } from "@prisma/client";

interface Asiento {
  id: string;
  numero: number;
  estado: EstadoAsiento;
}

interface Viaje {
  id: string;
  origen: string;
  destino: string;
  horarioSalida: string;
  precio: number;
  asientos: Asiento[];
}

interface Props {
  viaje: Viaje;
  user: { nombre: string; email: string };
}

type MetodoPago = "MERCADO_PAGO" | "EFECTIVO" | null;

export function ReservaForm({ viaje, user }: Props) {
  const router = useRouter();
  const [asientoId, setAsientoId] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const asientoSeleccionado = viaje.asientos.find((a) => a.id === asientoId);

  // Calcular filas (8 por fila para visualizar)
  const COLS = 4;
  const filas: Asiento[][] = [];
  for (let i = 0; i < viaje.asientos.length; i += COLS) {
    filas.push(viaje.asientos.slice(i, i + COLS));
  }

  async function handleReservar() {
    if (!asientoId || !metodoPago) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viajeId: viaje.id, asientoId, metodoPago }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al procesar la reserva");
        return;
      }

      if (metodoPago === "MERCADO_PAGO" && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        router.push(`/reserva/confirmacion?status=efectivo&reservaId=${data.reservaId}`);
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector de asientos */}
      <div className="card">
        <h2 className="font-bold text-lg text-brand-900 mb-2">1. Elegí tu asiento</h2>
        <p className="text-sm text-gray-500 mb-5">
          Hacé clic en un asiento disponible para seleccionarlo.
        </p>

        {/* Leyenda */}
        <div className="flex gap-4 mb-5 flex-wrap">
          {[
            { color: "bg-brand-700", label: "Disponible" },
            { color: "bg-yellow-400", label: "Seleccionado" },
            { color: "bg-gray-200", label: "Reservado" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className={`w-4 h-4 rounded ${l.color}`} />
              {l.label}
            </div>
          ))}
        </div>

        {/* Visualización del micro */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center text-white text-xs font-bold">🚌</div>
            <span className="text-xs text-gray-400 font-medium">FRENTE DEL MICRO</span>
            <div className="w-8" />
          </div>

          <div className="space-y-2">
            {filas.map((fila, fi) => (
              <div key={fi} className="flex gap-2 justify-center">
                {fila.map((asiento, ai) => {
                  const disponible = asiento.estado === "DISPONIBLE";
                  const seleccionado = asiento.id === asientoId;
                  return (
                    <button
                      key={asiento.id}
                      disabled={!disponible}
                      onClick={() => disponible && setAsientoId(seleccionado ? null : asiento.id)}
                      className={`w-12 h-12 rounded-lg text-xs font-bold border-2 transition-all duration-150 ${
                        seleccionado
                          ? "bg-yellow-400 border-yellow-500 text-brand-900 scale-105 shadow-md"
                          : disponible
                          ? "bg-brand-700 border-brand-800 text-white hover:bg-brand-600 hover:scale-105"
                          : "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed"
                      } ${ai === 1 ? "mr-6" : ""}`}
                      title={`Asiento ${asiento.numero} — ${disponible ? "Disponible" : "Reservado"}`}
                    >
                      {asiento.numero}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {asientoSeleccionado && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            ✅ Seleccionaste el <strong>Asiento N° {asientoSeleccionado.numero}</strong>
          </div>
        )}
      </div>

      {/* Método de pago */}
      <div className="card">
        <h2 className="font-bold text-lg text-brand-900 mb-2">2. Método de pago</h2>
        <p className="text-sm text-gray-500 mb-5">Elegí cómo querés pagar tu reserva.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Mercado Pago */}
          <button
            onClick={() => setMetodoPago("MERCADO_PAGO")}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              metodoPago === "MERCADO_PAGO"
                ? "border-brand-600 bg-brand-50"
                : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"
            }`}
          >
            <CreditCard className={`w-6 h-6 mt-0.5 flex-shrink-0 ${metodoPago === "MERCADO_PAGO" ? "text-brand-600" : "text-gray-400"}`} />
            <div>
              <p className="font-semibold text-gray-900">Mercado Pago</p>
              <p className="text-xs text-gray-500 mt-0.5">Tarjeta, débito, QR o saldo MP. Pago inmediato y seguro.</p>
              {metodoPago === "MERCADO_PAGO" && (
                <span className="inline-block mt-1.5 text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-medium">Seleccionado ✓</span>
              )}
            </div>
          </button>

          {/* Efectivo */}
          <button
            onClick={() => setMetodoPago("EFECTIVO")}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              metodoPago === "EFECTIVO"
                ? "border-green-600 bg-green-50"
                : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
            }`}
          >
            <Banknote className={`w-6 h-6 mt-0.5 flex-shrink-0 ${metodoPago === "EFECTIVO" ? "text-green-600" : "text-gray-400"}`} />
            <div>
              <p className="font-semibold text-gray-900">Pagar en la oficina</p>
              <p className="text-xs text-gray-500 mt-0.5">Reservá ahora y pagás en la oficina.</p>
              {metodoPago === "EFECTIVO" && (
                <span className="inline-block mt-1.5 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Seleccionado ✓</span>
              )}
            </div>
          </button>
        </div>

        {/* WhatsApp alternativo */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 text-sm">¿Preferís reservar por WhatsApp?</p>
              <p className="text-xs text-green-600 mt-0.5 mb-3">Nuestro equipo te atiende y hace la reserva por vos.</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { numero: "542324504000", label: "2324-504000" },
                  { numero: "542324560139", label: "2324-560139" },
                  { numero: "541122663000", label: "11-22663000" },
                ].map((wa) => (
                  <a
                    key={wa.numero}
                    href={`https://wa.me/${wa.numero}?text=${encodeURIComponent(`Hola! Quiero reservar el viaje de ${viaje.origen} a ${viaje.destino}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    📱 {wa.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Confirmación */}
      <div className="card bg-brand-50 border-brand-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-brand-900">3. Confirmar Reserva</h2>
          <p className="text-2xl font-bold text-brand-800">
            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(viaje.precio)}
          </p>
        </div>

        <div className="text-sm text-brand-700 mb-5 space-y-1">
          <p>📧 Recibirás la confirmación en <strong>{user.email}</strong></p>
          <p>⚠️ Podés cancelar hasta 24 horas antes de la salida</p>
        </div>

        <button
          onClick={handleReservar}
          disabled={!asientoId || !metodoPago || loading}
          className="w-full btn-primary flex items-center justify-center gap-2 text-base py-4 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              {metodoPago === "MERCADO_PAGO"
                ? "Pagar con Mercado Pago"
                : metodoPago === "EFECTIVO"
                ? "Confirmar Reserva (pago en la oficina)"
                : "Seleccioná asiento y método de pago"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
