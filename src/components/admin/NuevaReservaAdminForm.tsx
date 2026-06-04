"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CheckCircle, AlertCircle, Repeat, ChevronDown, X } from "lucide-react";

interface Asiento {
  id: string;
  numero: number;
  disponible: boolean;
}

interface Viaje {
  id: string;
  origen: string;
  destino: string;
  horarioSalida: string;
  precio: number;
  vehiculo: string;
  asientos: Asiento[];
  viajeRecurrenteId: string | null;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

interface Props {
  viajes: Viaje[];
  usuarioPreseleccionado: Usuario | null;
}

export function NuevaReservaAdminForm({ viajes, usuarioPreseleccionado }: Props) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioPreseleccionado);
  const [busquedaUsuario, setBusquedaUsuario] = useState("");
  const [resultados, setResultados] = useState<Usuario[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [viajeId, setViajeId] = useState("");
  const [asientoId, setAsientoId] = useState("");
  const [esFijo, setEsFijo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [busquedaViaje, setBusquedaViaje] = useState("");
  const [viajeDropdownAbierto, setViajeDropdownAbierto] = useState(false);
  const viajeRef = useRef<HTMLDivElement>(null);

  const viajeSeleccionado = viajes.find((v) => v.id === viajeId);
  const esRecurrente = !!viajeSeleccionado?.viajeRecurrenteId;

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (viajeRef.current && !viajeRef.current.contains(e.target as Node)) {
        setViajeDropdownAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Resetear esFijo si el viaje no es recurrente
  useEffect(() => {
    if (!esRecurrente) setEsFijo(false);
  }, [esRecurrente]);

  function formatearOpcionViaje(v: Viaje) {
    const horario = new Date(v.horarioSalida);
    const dia = new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(horario);
    const fecha = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(horario);
    const hora = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(horario);
    return { dia, fecha, hora, disp: v.asientos.filter((a) => a.disponible).length };
  }

  const viajesFiltrados = viajes.filter((v) => {
    const q = busquedaViaje.toLowerCase();
    if (!q) return true;
    const { dia, fecha, hora } = formatearOpcionViaje(v);
    return (
      v.origen.toLowerCase().includes(q) ||
      v.destino.toLowerCase().includes(q) ||
      fecha.includes(q) ||
      dia.toLowerCase().includes(q) ||
      hora.includes(q)
    );
  });

  // Agrupar viajes filtrados por ruta
  const gruposViajes = new Map<string, Viaje[]>();
  for (const v of viajesFiltrados) {
    const clave = `${v.origen} → ${v.destino}`;
    if (!gruposViajes.has(clave)) gruposViajes.set(clave, []);
    gruposViajes.get(clave)!.push(v);
  }

  useEffect(() => {
    if (busquedaUsuario.length < 2) { setResultados([]); return; }
    const timeout = setTimeout(async () => {
      setBuscando(true);
      const res = await fetch(`/api/admin/usuarios?q=${encodeURIComponent(busquedaUsuario)}`);
      if (res.ok) setResultados(await res.json());
      setBuscando(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [busquedaUsuario]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario || !viajeId || !asientoId) return;
    setGuardando(true);
    setError(null);

    const res = await fetch("/api/admin/reservas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: usuario.id, viajeId, asientoId, esFijo }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al crear la reserva");
      setGuardando(false);
      return;
    }

    router.push(`/admin/reservas?exito=1`);
  }

  const precioBonito = viajeSeleccionado
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(viajeSeleccionado.precio)
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Pasajero */}
      <div className="card">
        <h2 className="font-bold text-lg text-brand-900 mb-4">1. Pasajero</h2>

        {usuario ? (
          <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-xl">
            <div>
              <p className="font-semibold text-brand-900">{usuario.nombre}</p>
              <p className="text-sm text-brand-600">{usuario.email}</p>
            </div>
            <button
              type="button"
              onClick={() => { setUsuario(null); setBusquedaUsuario(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pl-9"
              placeholder="Buscar pasajero por nombre o email..."
              value={busquedaUsuario}
              onChange={(e) => setBusquedaUsuario(e.target.value)}
              autoComplete="off"
            />
            {buscando && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
            )}
            {resultados.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {resultados.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setUsuario(u); setBusquedaUsuario(""); setResultados([]); }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <p className="font-medium text-gray-900 text-sm">{u.nombre}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Viaje */}
      <div className="card">
        <h2 className="font-bold text-lg text-brand-900 mb-4">2. Viaje</h2>

        <div ref={viajeRef} className="relative">
          {/* Input buscador */}
          <div
            className="input flex items-center gap-2 cursor-pointer"
            onClick={() => setViajeDropdownAbierto(true)}
          >
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              className="flex-1 outline-none bg-transparent text-sm placeholder-gray-400"
              placeholder={viajeSeleccionado ? "" : "Buscar por destino, fecha u hora..."}
              value={viajeSeleccionado && !viajeDropdownAbierto
                ? (() => { const { dia, fecha, hora } = formatearOpcionViaje(viajeSeleccionado); return `${viajeSeleccionado.origen} → ${viajeSeleccionado.destino} — ${dia} ${fecha} ${hora}`; })()
                : busquedaViaje
              }
              onChange={(e) => { setBusquedaViaje(e.target.value); setViajeDropdownAbierto(true); }}
              onFocus={() => setViajeDropdownAbierto(true)}
              autoComplete="off"
            />
            {viajeSeleccionado ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); setViajeId(""); setAsientoId(""); setBusquedaViaje(""); }}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </div>

          {/* Dropdown */}
          {viajeDropdownAbierto && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
              {gruposViajes.size === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">Sin resultados</p>
              ) : (
                Array.from(gruposViajes.entries()).map(([ruta, lista]) => (
                  <div key={ruta}>
                    <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide bg-gray-50 sticky top-0">
                      {ruta}
                    </p>
                    {lista.map((v) => {
                      const { dia, fecha, hora, disp } = formatearOpcionViaje(v);
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => { setViajeId(v.id); setAsientoId(""); setBusquedaViaje(""); setViajeDropdownAbierto(false); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-brand-50 flex items-center justify-between gap-2 border-b border-gray-50 last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            {v.viajeRecurrenteId && <Repeat className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />}
                            <span className="text-sm font-medium text-gray-900">{dia} {fecha} — {hora}</span>
                          </div>
                          <span className={`text-xs font-semibold ${disp === 0 ? "text-red-500" : "text-green-600"}`}>
                            {disp === 0 ? "Agotado" : `${disp} disp.`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Opción pasajero fijo — solo si el viaje es parte de una plantilla recurrente */}
        {esRecurrente && (
          <div
            className={`mt-3 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
              esFijo ? "border-purple-400 bg-purple-50" : "border-gray-200 bg-gray-50"
            }`}
            onClick={() => setEsFijo(!esFijo)}
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                esFijo ? "bg-purple-600" : "bg-white border-2 border-gray-300"
              }`}
            >
              {esFijo && <Repeat className="w-3 h-3 text-white" />}
            </div>
            <div>
              <p className={`text-sm font-semibold ${esFijo ? "text-purple-800" : "text-gray-700"}`}>
                Agregar como pasajero fijo
              </p>
              <p className="text-xs text-gray-500">
                Se reservará un asiento automáticamente cada semana en este mismo horario.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Asiento */}
      {viajeSeleccionado && (
        <div className="card">
          <h2 className="font-bold text-lg text-brand-900 mb-2">3. Asiento</h2>
          <p className="text-sm text-gray-500 mb-4">{viajeSeleccionado.vehiculo}</p>

          {viajeSeleccionado.asientos.every((a) => !a.disponible) ? (
            <p className="text-red-600 text-sm">No hay asientos disponibles en este viaje.</p>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-brand-700 inline-block" /> Disponible</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-400 inline-block" /> Ocupado</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-500 inline-block" /> Seleccionado</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {viajeSeleccionado.asientos.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    disabled={!a.disponible}
                    onClick={() => a.disponible && setAsientoId(asientoId === a.id ? "" : a.id)}
                    className={`w-12 h-12 rounded-lg font-bold text-sm border-2 transition-all ${
                      asientoId === a.id
                        ? "bg-green-500 border-green-600 text-white scale-105 shadow"
                        : !a.disponible
                        ? "bg-amber-400 border-amber-500 text-amber-900 cursor-not-allowed"
                        : "bg-brand-700 border-brand-800 text-white hover:bg-brand-600"
                    }`}
                  >
                    {a.numero}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. Confirmar */}
      {usuario && viajeSeleccionado && asientoId && (
        <div className="card bg-brand-50 border border-brand-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-brand-900">4. Confirmar</h2>
            <span className="text-xl font-bold text-brand-800">{precioBonito}</span>
          </div>
          <div className="text-sm text-brand-700 space-y-1 mb-4">
            <p>👤 <strong>{usuario.nombre}</strong></p>
            <p>🗺️ {viajeSeleccionado.origen} → {viajeSeleccionado.destino}</p>
            <p>💺 Asiento N° {viajeSeleccionado.asientos.find((a) => a.id === asientoId && a.disponible)?.numero}</p>
            <p>💵 Método: <strong>Pago en la oficina</strong></p>
            {esFijo && <p>🔁 <strong>Pasajero fijo</strong> — se auto-reservará cada semana</p>}
          </div>
          <p className="text-xs text-brand-600 mb-4">Se enviará un email de confirmación al pasajero.</p>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {guardando
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando reserva...</>
              : <><CheckCircle className="w-4 h-4" /> Confirmar Reserva{esFijo ? " (Pasajero Fijo)" : ""}</>
            }
          </button>
        </div>
      )}
    </form>
  );
}
