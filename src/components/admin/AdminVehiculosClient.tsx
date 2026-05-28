"use client";

import { useState } from "react";
import { Loader2, Save, Plus, Bus, Edit2, ToggleLeft, ToggleRight } from "lucide-react";

interface Vehiculo {
  id: string;
  patente: string;
  descripcion: string;
  capacidad: number;
  activo: boolean;
  totalViajes: number;
}

interface Props {
  vehiculos: Vehiculo[];
}

export function AdminVehiculosClient({ vehiculos: initial }: Props) {
  const [vehiculos, setVehiculos] = useState(initial);
  const [editando, setEditando] = useState<Vehiculo | null>(null);
  const [form, setForm] = useState({ patente: "", descripcion: "", capacidad: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  function abrirNuevo() {
    setEditando(null);
    setForm({ patente: "", descripcion: "", capacidad: "" });
    setError(null);
    setMostrarForm(true);
  }

  function abrirEdicion(v: Vehiculo) {
    setEditando(v);
    setForm({ patente: v.patente, descripcion: v.descripcion, capacidad: String(v.capacidad) });
    setError(null);
    setMostrarForm(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = { ...form, capacidad: parseInt(form.capacidad) };
    const url = editando ? `/api/admin/vehiculos/${editando.id}` : "/api/admin/vehiculos";
    const method = editando ? "PATCH" : "POST";

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

    if (editando) {
      setVehiculos((prev) => prev.map((v) => (v.id === editando.id ? { ...v, ...payload } : v)));
    } else {
      setVehiculos((prev) => [{ ...data, totalViajes: 0 }, ...prev]);
    }

    setMostrarForm(false);
    setLoading(false);
  }

  async function toggleActivo(id: string, activo: boolean) {
    const res = await fetch(`/api/admin/vehiculos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !activo }),
    });
    if (res.ok) {
      setVehiculos((prev) => prev.map((v) => (v.id === id ? { ...v, activo: !activo } : v)));
    }
  }

  return (
    <div className="space-y-6">
      {/* Formulario */}
      {mostrarForm ? (
        <div className="card">
          <h2 className="font-bold text-lg text-gray-900 mb-4">
            {editando ? "Editar Vehículo" : "Nuevo Vehículo"}
          </h2>
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Patente *</label>
                <input type="text" className="input uppercase" placeholder="AB123CD" value={form.patente}
                  onChange={(e) => setForm({ ...form, patente: e.target.value.toUpperCase() })} required maxLength={10} />
              </div>
              <div>
                <label className="label">Capacidad (asientos) *</label>
                <input type="number" className="input" placeholder="40" value={form.capacidad}
                  onChange={(e) => setForm({ ...form, capacidad: e.target.value })} required min="1" max="100" />
              </div>
            </div>
            <div>
              <label className="label">Descripción *</label>
              <input type="text" className="input" placeholder="Micro Mercedes Benz — Diferencial" value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })} required />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar</>}
              </button>
              <button type="button" onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      ) : (
        <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Vehículo
        </button>
      )}

      {/* Lista */}
      <div className="card overflow-hidden p-0">
        <div className="divide-y divide-gray-100">
          {vehiculos.map((v) => (
            <div key={v.id} className={`flex items-center gap-4 px-4 py-4 ${!v.activo ? "opacity-50" : ""}`}>
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bus className="w-5 h-5 text-brand-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{v.descripcion}</p>
                <p className="text-sm text-gray-500">
                  Patente: <span className="font-mono">{v.patente}</span> — {v.capacidad} asientos — {v.totalViajes} viajes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={v.activo ? "badge-success" : "badge-gray"}>{v.activo ? "Activo" : "Inactivo"}</span>
                <button onClick={() => abrirEdicion(v)} className="p-1.5 text-gray-400 hover:text-brand-700 hover:bg-brand-50 rounded" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => toggleActivo(v.id, v.activo)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded" title={v.activo ? "Desactivar" : "Activar"}>
                  {v.activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          {vehiculos.length === 0 && (
            <p className="text-center py-10 text-gray-400">No hay vehículos registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}
