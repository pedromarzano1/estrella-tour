"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Repeat } from "lucide-react";

interface Vehiculo {
  id: string;
  patente: string;
  descripcion: string;
  capacidad: number;
}

interface Props {
  vehiculos: Vehiculo[];
  viajeEditar?: {
    id: string;
    origen: string;
    destino: string;
    horarioSalida: string;
    precio: number;
    vehiculoId: string;
    observaciones: string | null;
  };
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function NuevoViajeForm({ vehiculos, viajeEditar }: Props) {
  const router = useRouter();
  const esEdicion = !!viajeEditar;

  const [esFijo, setEsFijo] = useState(false);

  const [form, setForm] = useState({
    origen: viajeEditar?.origen ?? "",
    destino: viajeEditar?.destino ?? "",
    horarioSalida: viajeEditar?.horarioSalida
      ? new Date(viajeEditar.horarioSalida).toISOString().slice(0, 16)
      : "",
    precio: viajeEditar?.precio?.toString() ?? "",
    vehiculoId: viajeEditar?.vehiculoId ?? "",
    observaciones: viajeEditar?.observaciones ?? "",
  });

  const [formFijo, setFormFijo] = useState({
    diaSemana: "5", // Viernes por defecto
    hora: "13:45",
    semanas: "8",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vehiculoSeleccionadoFijo = vehiculos.find((v) => v.id === form.vehiculoId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (esFijo && !esEdicion) {
      const payload = {
        origen: form.origen,
        destino: form.destino,
        diaSemana: parseInt(formFijo.diaSemana),
        hora: formFijo.hora,
        precio: parseFloat(form.precio),
        vehiculoId: form.vehiculoId,
        observaciones: form.observaciones || undefined,
        semanas: parseInt(formFijo.semanas),
      };

      const res = await fetch("/api/admin/viajes-recurrentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        setLoading(false);
        return;
      }

      router.push("/admin/viajes");
      router.refresh();
      return;
    }

    const payload = {
      ...form,
      precio: parseFloat(form.precio),
      horarioSalida: new Date(form.horarioSalida).toISOString(),
    };

    const url = esEdicion ? `/api/admin/viajes/${viajeEditar!.id}` : "/api/admin/viajes";
    const method = esEdicion ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error al guardar");
      setLoading(false);
      return;
    }

    router.push("/admin/viajes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {/* Toggle viaje fijo — solo al crear */}
      {!esEdicion && (
        <div
          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
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
              Viaje fijo (se repite cada semana)
            </p>
            <p className="text-xs text-gray-500">
              Se generarán viajes automáticamente y los pasajeros fijos se reservarán solos.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Ciudad de Origen *</label>
          <input
            type="text"
            className="input"
            placeholder="Mercedes"
            value={form.origen}
            onChange={(e) => setForm({ ...form, origen: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Ciudad de Destino *</label>
          <input
            type="text"
            className="input"
            placeholder="Buenos Aires"
            value={form.destino}
            onChange={(e) => setForm({ ...form, destino: e.target.value })}
            required
          />
        </div>
      </div>

      {esFijo ? (
        /* Campos para viaje fijo */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
          <div>
            <label className="label text-purple-800">Día de la semana *</label>
            <select
              className="input"
              value={formFijo.diaSemana}
              onChange={(e) => setFormFijo({ ...formFijo, diaSemana: e.target.value })}
              required
            >
              {DIAS.map((d, i) => (
                <option key={i} value={i}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-purple-800">Hora de salida *</label>
            <input
              type="time"
              className="input"
              value={formFijo.hora}
              onChange={(e) => setFormFijo({ ...formFijo, hora: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label text-purple-800">Generar semanas</label>
            <select
              className="input"
              value={formFijo.semanas}
              onChange={(e) => setFormFijo({ ...formFijo, semanas: e.target.value })}
            >
              {[4, 8, 12, 16].map((n) => (
                <option key={n} value={n}>{n} semanas</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        /* Campo fecha/hora para viaje puntual */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Fecha y Hora de Salida *</label>
            <input
              type="datetime-local"
              className="input"
              value={form.horarioSalida}
              onChange={(e) => setForm({ ...form, horarioSalida: e.target.value })}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
          <div>
            <label className="label">Precio por asiento (ARS) *</label>
            <input
              type="number"
              className="input"
              placeholder="5000"
              value={form.precio}
              onChange={(e) => setForm({ ...form, precio: e.target.value })}
              required
              min="1"
              step="0.01"
            />
          </div>
        </div>
      )}

      {esFijo && (
        <div>
          <label className="label">Precio por asiento (ARS) *</label>
          <input
            type="number"
            className="input"
            placeholder="5000"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            required
            min="1"
            step="0.01"
          />
        </div>
      )}

      <div>
        <label className="label">Vehículo *</label>
        <select
          className="input"
          value={form.vehiculoId}
          onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
          required
        >
          <option value="">Seleccioná un vehículo...</option>
          {vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.descripcion} — {v.patente} ({v.capacidad} asientos)
            </option>
          ))}
        </select>
        {vehiculoSeleccionadoFijo && (
          <p className="text-xs text-gray-500 mt-1">
            {esFijo
              ? `Se crearán ${vehiculoSeleccionadoFijo.capacidad} asientos por cada viaje generado.`
              : `Se crearán ${vehiculoSeleccionadoFijo.capacidad} asientos para este viaje.`}
          </p>
        )}
      </div>

      <div>
        <label className="label">Observaciones <span className="text-gray-400 font-normal">(opcional)</span></label>
        <textarea
          className="input resize-none"
          rows={3}
          placeholder="Servicio con aire acondicionado, sin paradas intermedias..."
          value={form.observaciones}
          onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
        />
      </div>

      {vehiculos.length === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          No hay vehículos registrados. <a href="/admin/vehiculos" className="underline font-medium">Crear un vehículo primero</a>.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading || vehiculos.length === 0}
          className="btn-primary flex items-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
          ) : (
            <><Save className="w-4 h-4" /> {esEdicion ? "Guardar Cambios" : esFijo ? "Crear Viaje Fijo" : "Crear Viaje"}</>
          )}
        </button>
        <a href="/admin/viajes" className="btn-secondary">Cancelar</a>
      </div>
    </form>
  );
}
