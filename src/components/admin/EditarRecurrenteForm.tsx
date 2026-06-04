"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";

interface Vehiculo {
  id: string;
  patente: string;
  descripcion: string;
  capacidad: number;
}

interface Props {
  recurrente: {
    id: string;
    origen: string;
    destino: string;
    diaSemana: number;
    hora: string;
    precio: number;
    vehiculoId: string;
    observaciones: string | null;
  };
  vehiculos: Vehiculo[];
}

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function EditarRecurrenteForm({ recurrente, vehiculos }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    origen: recurrente.origen,
    destino: recurrente.destino,
    diaSemana: recurrente.diaSemana.toString(),
    hora: recurrente.hora,
    precio: recurrente.precio.toString(),
    vehiculoId: recurrente.vehiculoId,
    observaciones: recurrente.observaciones ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/admin/viajes-recurrentes/${recurrente.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origen: form.origen,
        destino: form.destino,
        diaSemana: parseInt(form.diaSemana),
        hora: form.hora,
        precio: parseFloat(form.precio),
        vehiculoId: form.vehiculoId,
        observaciones: form.observaciones || null,
      }),
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Ciudad de Origen *</label>
          <input
            type="text"
            className="input"
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
            value={form.destino}
            onChange={(e) => setForm({ ...form, destino: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
        <div>
          <label className="label text-purple-800">Día de la semana *</label>
          <select
            className="input"
            value={form.diaSemana}
            onChange={(e) => setForm({ ...form, diaSemana: e.target.value })}
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
            value={form.hora}
            onChange={(e) => setForm({ ...form, hora: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label text-purple-800">Precio (ARS) *</label>
          <input
            type="number"
            className="input"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            required
            min="1"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="label">Vehículo *</label>
        <select
          className="input"
          value={form.vehiculoId}
          onChange={(e) => setForm({ ...form, vehiculoId: e.target.value })}
          required
        >
          {vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.descripcion} — {v.patente} ({v.capacidad} asientos)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Observaciones <span className="text-gray-400 font-normal">(opcional)</span></label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.observaciones}
          onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar Cambios</>}
        </button>
        <a href="/admin/viajes" className="btn-secondary">Cancelar</a>
      </div>
    </form>
  );
}
