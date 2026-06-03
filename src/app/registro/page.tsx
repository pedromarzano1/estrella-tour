"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Image from "next/image";

export default function RegistroPage() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Error al registrarse");
      setLoading(false);
      return;
    }

    window.location.href = "/viajes";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-brand-900 to-accent-900 px-4 py-8">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8 hover:opacity-90 transition-opacity">
          <Image src="/logo-estrella.webp" alt="Estrella Tour" width={160} height={52} className="h-14 w-auto" />
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mb-6">Registrate para reservar tus viajes online.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre completo</label>
              <input
                type="text"
                className="input"
                placeholder="Juan García"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                autoComplete="email"
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
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="input pr-10"
                  placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Mínimo 8 caracteres, una mayúscula y un número</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</> : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-brand-700 font-semibold hover:underline">
              Ingresar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
