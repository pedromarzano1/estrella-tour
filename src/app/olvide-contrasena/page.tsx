"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

export default function OlvideContrasenaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    await fetch("/api/auth/olvide-contrasena", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});

    setLoading(false);
    setEnviado(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-brand-900 to-accent-900 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 text-white font-bold text-2xl mb-8">
          <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
          Estrella Tour
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {enviado ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Revisá tu email</h1>
              <p className="text-gray-500 text-sm mb-6">
                Si ese email tiene una cuenta registrada, te mandamos un enlace para restablecer tu contraseña. Revisá también la carpeta de spam.
              </p>
              <Link href="/login" className="btn-primary text-center block">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
                <ArrowLeft className="w-4 h-4" />
                Volver al login
              </Link>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">Olvidé mi contraseña</h1>
              <p className="text-gray-500 text-sm mb-6">
                Ingresá tu email y te enviamos un enlace para crear una nueva contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
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
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : "Enviar enlace"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
