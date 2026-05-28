"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { User, Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface UserData {
  nombre: string;
  email: string;
  telefono: string | null;
  rol: string;
}

export default function MiCuentaPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [form, setForm] = useState({ nombre: "", telefono: "" });
  const [passForm, setPassForm] = useState({ passwordActual: "", passwordNueva: "", passwordRepetir: "" });
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [mensajePerfil, setMensajePerfil] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [mensajePass, setMensajePass] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setForm({ nombre: data.user.nombre, telefono: data.user.telefono ?? "" });
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => (window.location.href = "/login"));
  }, []);

  async function handlePerfil(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPerfil(true);
    setMensajePerfil(null);
    const res = await fetch("/api/auth/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: form.nombre, telefono: form.telefono }),
    });
    const data = await res.json();
    setLoadingPerfil(false);
    if (!res.ok) {
      setMensajePerfil({ tipo: "error", texto: data.error ?? "Error al actualizar" });
    } else {
      setUser((u) => u ? { ...u, nombre: data.user.nombre, telefono: data.user.telefono } : u);
      setMensajePerfil({ tipo: "ok", texto: "Datos actualizados correctamente." });
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passForm.passwordNueva !== passForm.passwordRepetir) {
      setMensajePass({ tipo: "error", texto: "Las contraseñas nuevas no coinciden." });
      return;
    }
    setLoadingPass(true);
    setMensajePass(null);
    const res = await fetch("/api/auth/perfil", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordActual: passForm.passwordActual, passwordNueva: passForm.passwordNueva }),
    });
    const data = await res.json();
    setLoadingPass(false);
    if (!res.ok) {
      setMensajePass({ tipo: "error", texto: data.error ?? "Error al cambiar contraseña" });
    } else {
      setMensajePass({ tipo: "ok", texto: "Contraseña actualizada. Iniciá sesión nuevamente." });
      setTimeout(() => { window.location.href = "/login"; }, 2000);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sky-50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-sky-50">
      <Navbar user={{ nombre: user.nombre, rol: user.rol }} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Mi Cuenta</h1>

        {/* Datos personales */}
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Datos personales</h2>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handlePerfil} className="space-y-4">
            <div>
              <label className="label">Nombre completo</label>
              <input
                type="text"
                className="input"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="label">Teléfono <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input
                type="tel"
                className="input"
                placeholder="2324-XXXXXX"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </div>

            {mensajePerfil && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                mensajePerfil.tipo === "ok"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {mensajePerfil.tipo === "ok"
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {mensajePerfil.texto}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingPerfil}
              className="btn-primary flex items-center gap-2"
            >
              {loadingPerfil ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : "Guardar cambios"}
            </button>
          </form>
        </div>

        {/* Cambiar contraseña */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-brand-600" />
            </div>
            <h2 className="font-bold text-gray-900">Cambiar contraseña</h2>
          </div>

          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="label">Contraseña actual</label>
              <input
                type="password"
                className="input"
                value={passForm.passwordActual}
                onChange={(e) => setPassForm({ ...passForm, passwordActual: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Nueva contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                value={passForm.passwordNueva}
                onChange={(e) => setPassForm({ ...passForm, passwordNueva: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Repetir nueva contraseña</label>
              <input
                type="password"
                className="input"
                value={passForm.passwordRepetir}
                onChange={(e) => setPassForm({ ...passForm, passwordRepetir: e.target.value })}
                required
              />
            </div>

            {mensajePass && (
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                mensajePass.tipo === "ok"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}>
                {mensajePass.tipo === "ok"
                  ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {mensajePass.texto}
              </div>
            )}

            <button
              type="submit"
              disabled={loadingPass}
              className="btn-primary flex items-center gap-2"
            >
              {loadingPass ? <><Loader2 className="w-4 h-4 animate-spin" /> Cambiando...</> : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
