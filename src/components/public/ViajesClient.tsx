"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MapPin, Clock, Bus, ArrowRight, Calendar } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatearPrecio } from "@/lib/utils";

interface Viaje {
  id: string;
  origen: string;
  destino: string;
  horarioSalida: string;
  precio: number;
  observaciones: string | null;
  vehiculo: { descripcion: string };
  asientosDisponibles: number;
}

interface Props {
  viajes: Viaje[];
  isLoggedIn: boolean;
}

function formatFechaDia(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

function formatHora(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function clavesDia(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ViajesClient({ viajes, isLoggedIn }: Props) {
  // Clave normalizada para comparar rutas sin importar capitalización ni espacios
  function claveRuta(origen: string, destino: string) {
    return `${origen.trim().toLowerCase()}|||${destino.trim().toLowerCase()}`;
  }

  // Rutas únicas globales (de todos los viajes), deduplicadas por clave normalizada
  const rutasGlobales = useMemo(() => {
    const seen = new Map<string, { key: string; origen: string; destino: string }>();
    for (const v of viajes) {
      const k = claveRuta(v.origen, v.destino);
      if (!seen.has(k)) seen.set(k, { key: k, origen: v.origen.trim(), destino: v.destino.trim() });
    }
    return Array.from(seen.values());
  }, [viajes]);

  const [rutaSeleccionada, setRutaSeleccionada] = useState<string>("todas");

  // Viajes filtrados por ruta
  const viajesPorRuta = useMemo(() => {
    if (rutaSeleccionada === "todas") return viajes;
    return viajes.filter((v) => claveRuta(v.origen, v.destino) === rutaSeleccionada);
  }, [viajes, rutaSeleccionada]);

  // Días disponibles para la ruta seleccionada
  const dias = useMemo(() => {
    const keys = Array.from(new Set(viajesPorRuta.map((v) => clavesDia(v.horarioSalida))));
    return keys.sort();
  }, [viajesPorRuta]);

  const [diaSeleccionado, setDiaSeleccionado] = useState<string>(dias[0] ?? "");

  // Cuando cambia la ruta, resetear al primer día disponible
  function seleccionarRuta(ruta: string) {
    setRutaSeleccionada(ruta);
    const diasNuevos = Array.from(
      new Set(
        (ruta === "todas" ? viajes : viajes.filter((v) => claveRuta(v.origen, v.destino) === ruta))
          .map((v) => clavesDia(v.horarioSalida))
      )
    ).sort();
    setDiaSeleccionado(diasNuevos[0] ?? "");
  }

  const viajesFiltrados = useMemo(
    () => viajesPorRuta.filter((v) => clavesDia(v.horarioSalida) === diaSeleccionado),
    [viajesPorRuta, diaSeleccionado]
  );

  if (viajes.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">No hay viajes disponibles</h2>
        <p className="text-gray-400">Por el momento no hay viajes programados. Consultá por WhatsApp.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filtro de rutas — siempre visible si hay más de una ruta */}
      {rutasGlobales.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => seleccionarRuta("todas")}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              rutaSeleccionada === "todas"
                ? "bg-brand-700 text-white border-brand-700"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
            }`}
          >
            Todas las rutas
          </button>
          {rutasGlobales.map((r) => (
            <button
              key={r.key}
              onClick={() => seleccionarRuta(r.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                rutaSeleccionada === r.key
                  ? "bg-brand-700 text-white border-brand-700"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
            >
              <MapPin className="w-3 h-3" />
              {r.origen} → {r.destino}
            </button>
          ))}
        </div>
      )}

      {/* Selector de días */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        {dias.map((dia) => {
          const fecha = new Date(dia + "T12:00:00");
          const hoy = new Date();
          const esHoy =
            fecha.getDate() === hoy.getDate() &&
            fecha.getMonth() === hoy.getMonth() &&
            fecha.getFullYear() === hoy.getFullYear();
          const diaSemana = new Intl.DateTimeFormat("es-AR", { weekday: "short" }).format(fecha);
          const numeroDia = fecha.getDate();
          const mes = new Intl.DateTimeFormat("es-AR", { month: "short" }).format(fecha);
          const cant = viajes.filter((v) => clavesDia(v.horarioSalida) === dia).length;
          const activo = diaSeleccionado === dia;

          return (
            <button
              key={dia}
              onClick={() => setDiaSeleccionado(dia)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border-2 transition-all min-w-[80px] ${
                activo
                  ? "border-brand-700 bg-brand-700 text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              <span className={`text-xs font-medium uppercase ${activo ? "text-brand-200" : "text-gray-400"}`}>
                {esHoy ? "Hoy" : diaSemana}
              </span>
              <span className="text-2xl font-bold leading-tight">{numeroDia}</span>
              <span className={`text-xs ${activo ? "text-brand-200" : "text-gray-400"}`}>{mes}</span>
              <span className={`text-xs mt-1 font-semibold ${activo ? "text-white" : "text-brand-700"}`}>
                {cant} viaje{cant !== 1 ? "s" : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Título */}
      <p className="text-sm font-medium text-gray-500 mb-4 capitalize">
        {formatFechaDia(diaSeleccionado + "T12:00:00")} — {viajesFiltrados.length} viaje{viajesFiltrados.length !== 1 ? "s" : ""}
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {viajesFiltrados.map((viaje) => {
          const asientosDisponibles = viaje.asientosDisponibles;
          const agotado = asientosDisponibles === 0;
          const pocosAsientos = asientosDisponibles <= 5 && asientosDisponibles > 0;
          const fechaFormateada = formatFechaDia(viaje.horarioSalida);
          const horaFormateada = formatHora(viaje.horarioSalida);

          return (
            <div
              key={viaje.id}
              className={`card hover:shadow-lg transition-all duration-200 flex flex-col bg-brand-50 border border-brand-200 ${agotado ? "opacity-75" : ""}`}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-brand-900">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="font-bold">{viaje.origen}</span>
                  </div>
                  <div className="ml-5 my-1 text-gray-400 text-xs">↓</div>
                  <div className="flex items-center gap-1.5 text-brand-900">
                    <MapPin className="w-4 h-4 flex-shrink-0 text-red-500" />
                    <span className="font-bold">{viaje.destino}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-800">{formatearPrecio(viaje.precio)}</p>
                  <p className="text-xs text-gray-400">por persona</p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-3 border-y border-gray-100 mb-4">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <div>
                    <p className="text-xs text-gray-400">Salida</p>
                    <p className="font-semibold text-sm">{horaFormateada}</p>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 capitalize">{fechaFormateada}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <Bus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 truncate">{viaje.vehiculo.descripcion}</span>
              </div>

              <div className="mb-4">
                {agotado ? (
                  <span className="badge-danger">Sin asientos disponibles</span>
                ) : pocosAsientos ? (
                  <span className="badge-warning">⚡ Últimos {asientosDisponibles} asientos</span>
                ) : (
                  <span className="badge-success">{asientosDisponibles} asientos disponibles</span>
                )}
              </div>

              {viaje.observaciones && (
                <p className="text-xs text-gray-400 italic mb-4">{viaje.observaciones}</p>
              )}

              <div className="mt-auto flex gap-2">
                {agotado ? (
                  <div className="flex-1 text-center py-3 bg-gray-100 text-gray-400 rounded-lg font-medium text-sm">
                    Agotado
                  </div>
                ) : isLoggedIn ? (
                  <Link
                    href={`/reservar/${viaje.id}`}
                    className="flex-1 btn-primary text-center flex items-center justify-center gap-2"
                  >
                    Reservar Asiento
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/login?callbackUrl=/reservar/${viaje.id}`}
                    className="flex-1 btn-secondary text-center flex items-center justify-center gap-2"
                  >
                    Ingresar para reservar
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                <a
                  href={`/api/wa?to=mercedes1&msg=${encodeURIComponent(`Hola! Quisiera reservar el viaje del ${fechaFormateada} a las ${horaFormateada} de ${viaje.origen} a ${viaje.destino}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
                  title="Reservar por WhatsApp"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}