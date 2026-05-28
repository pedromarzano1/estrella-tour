"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, UserPlus, MessageCircle, TicketCheck, X, Loader2, CheckCircle } from "lucide-react";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  creadoEn: string;
  _count: { reservas: number };
}

interface Props {
  usuarios: Usuario[];
}

export function AdminUsuariosClient({ usuarios: inicial }: Props) {
  const [lista, setLista] = useState(inicial);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtrados = lista.filter((u) => {
    if (!busqueda) return true;
    const q = busqueda.toLowerCase();
    return (
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.telefono ?? "").includes(q)
    );
  });

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al crear el usuario");
      setGuardando(false);
      return;
    }

    setLista((prev) => [{ ...data.user, activo: true, _count: { reservas: 0 } }, ...prev]);
    setExito(`Usuario ${data.user.nombre} creado. Se le envió un email para activar su cuenta.`);
    setForm({ nombre: "", email: "", telefono: "" });
    setMostrarForm(false);
    setGuardando(false);
  }

  return (
    <div className="space-y-4">
      {exito && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm flex-1">{exito}</p>
          <button onClick={() => setExito(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Barra de acciones */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Buscar por nombre, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setMostrarForm(true); setError(null); }}
          className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Formulario de creación */}
      {mostrarForm && (
        <div className="card border border-brand-200 bg-brand-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-brand-900">Crear nuevo usuario</h2>
            <button onClick={() => setMostrarForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCrear} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Nombre completo *</label>
              <input
                className="input"
                placeholder="Juan Pérez"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                type="email"
                className="input"
                placeholder="juan@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Teléfono (opcional)</label>
              <input
                className="input"
                placeholder="2324-XXXXXX"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>
            {error && (
              <div className="sm:col-span-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="sm:col-span-3 flex gap-3">
              <button
                type="submit"
                disabled={guardando}
                className="btn-primary flex items-center gap-2 text-sm"
              >
                {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : "Crear y enviar email"}
              </button>
              <button type="button" onClick={() => setMostrarForm(false)} className="btn-secondary text-sm">
                Cancelar
              </button>
            </div>
          </form>
          <p className="text-xs text-brand-700 mt-3">
            Se enviará un email al usuario con un enlace para que active su cuenta y cree su contraseña.
          </p>
        </div>
      )}

      {/* Tabla */}
      <div className="card overflow-hidden p-0">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <span className="text-sm font-medium text-gray-500">{filtrados.length} usuarios</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Contacto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reservas</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Registro</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtrados.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.nombre}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.telefono ? (
                      <a
                        href={`https://wa.me/${u.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${u.nombre}, te contactamos de Estrella Tour.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:underline"
                      >
                        <MessageCircle className="w-3 h-3" />
                        {u.telefono}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Sin teléfono</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-700">{u._count.reservas}</span>
                    <span className="text-gray-400 text-xs ml-1">reservas</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(u.creadoEn))}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/reservas/nueva?userId=${u.id}&nombre=${encodeURIComponent(u.nombre)}`}
                      className="flex items-center gap-1 text-xs text-brand-700 hover:text-brand-900 hover:underline font-medium"
                    >
                      <TicketCheck className="w-3.5 h-3.5" />
                      Crear reserva
                    </Link>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    {busqueda ? "Sin resultados para esa búsqueda" : "No hay usuarios registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
