"use client";

import { useState } from "react";
import { UserPlus, X, Loader2, CheckCircle, ShieldCheck, ShieldOff, Mail } from "lucide-react";

interface Empleado {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
  creadoEn: string;
  soyYo: boolean;
}

interface Props {
  empleados: Empleado[];
}

export function AdminEmpleadosClient({ empleados: inicial }: Props) {
  const [lista, setLista] = useState(inicial);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "" });
  const [guardando, setGuardando] = useState(false);
  const [accion, setAccion] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkActivacion, setLinkActivacion] = useState<string | null>(null);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);

    const res = await fetch("/api/admin/empleados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al crear el empleado");
      setGuardando(false);
      return;
    }

    setLista((prev) => [...prev, { ...data.empleado, soyYo: false }]);
    setForm({ nombre: "", email: "" });
    setMostrarForm(false);
    setGuardando(false);

    if (data.emailEnviado) {
      setExito(`Cuenta creada para ${data.empleado.nombre}. Se le envió el email de activación.`);
      setLinkActivacion(null);
    } else {
      setError(`Cuenta creada, pero no se pudo enviar el email: ${data.emailError ?? "error desconocido"}. Copiá el link de activación y enviáselo manualmente.`);
      setLinkActivacion(data.activationLink);
    }
  }

  async function toggleActivo(id: string) {
    setAccion(id);
    const res = await fetch(`/api/admin/empleados/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json();
    if (res.ok) {
      setLista((prev) => prev.map((e) => (e.id === id ? { ...e, activo: data.empleado.activo } : e)));
    }
    setAccion(null);
  }

  async function reenviarEmail(id: string) {
    setAccion(`reenviar-${id}`);
    setError(null);
    setLinkActivacion(null);
    const res = await fetch(`/api/admin/empleados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reenviarActivacion: true }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.emailEnviado) {
        setExito("Email de activación reenviado.");
      } else {
        setError(`No se pudo enviar el email: ${data.emailError ?? "error desconocido"}. Copiá el link y enviáselo por WhatsApp.`);
        setLinkActivacion(data.activationLink);
      }
    }
    setAccion(null);
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

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-3">
            <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              {linkActivacion && (
                <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Link de activación (enviáselo por WhatsApp):</p>
                  <p className="text-xs text-brand-700 break-all font-mono">{linkActivacion}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(linkActivacion); setExito("Link copiado al portapapeles."); setError(null); setLinkActivacion(null); }}
                    className="mt-2 text-xs bg-brand-700 text-white px-3 py-1.5 rounded-lg hover:bg-brand-800"
                  >
                    Copiar link
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => { setError(null); setLinkActivacion(null); }}><X className="w-4 h-4 text-red-400" /></button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{lista.length} {lista.length === 1 ? "empleado" : "empleados"} con acceso al panel</p>
        <button
          onClick={() => { setMostrarForm(true); setError(null); }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Empleado
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="card border border-brand-200 bg-brand-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-brand-900">Nuevo empleado</h2>
            <button onClick={() => setMostrarForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCrear} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre completo *</label>
              <input
                className="input"
                placeholder="María González"
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
                placeholder="maria@estrellatour.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            {error && (
              <div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={guardando} className="btn-primary flex items-center gap-2 text-sm">
                {guardando ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : "Crear y enviar email"}
              </button>
              <button type="button" onClick={() => setMostrarForm(false)} className="btn-secondary text-sm">
                Cancelar
              </button>
            </div>
          </form>
          <p className="text-xs text-brand-700 mt-3">
            El empleado recibirá un email para crear su contraseña y activar su cuenta.
          </p>
        </div>
      )}

      {/* Lista */}
      <div className="grid gap-3">
        {lista.map((e) => (
          <div
            key={e.id}
            className={`card flex flex-col sm:flex-row sm:items-center gap-4 ${!e.activo ? "opacity-60 bg-gray-50" : ""}`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${e.activo ? "bg-slate-700" : "bg-gray-400"}`}>
                {e.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{e.nombre}</p>
                  {e.soyYo && (
                    <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Vos</span>
                  )}
                  {!e.activo && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Desactivado</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{e.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Desde {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(e.creadoEn))}
                </p>
              </div>
            </div>

            {!e.soyYo && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => reenviarEmail(e.id)}
                  disabled={accion === `reenviar-${e.id}`}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Reenviar email de activación"
                >
                  {accion === `reenviar-${e.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  Reenviar email
                </button>
                <button
                  onClick={() => toggleActivo(e.id)}
                  disabled={accion === e.id}
                  className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-colors ${
                    e.activo
                      ? "bg-red-50 text-red-600 hover:bg-red-100"
                      : "bg-green-50 text-green-700 hover:bg-green-100"
                  }`}
                >
                  {accion === e.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : e.activo
                    ? <ShieldOff className="w-3.5 h-3.5" />
                    : <ShieldCheck className="w-3.5 h-3.5" />
                  }
                  {e.activo ? "Desactivar" : "Reactivar"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
