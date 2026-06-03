"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";
import { LogoEstrella } from "@/components/icons/LogoEstrella";

function NuevaContrasenaContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ passwordNueva: "", passwordRepetir: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || token.length !== 64) {
      setError("El enlace es inválido. Solicitá uno nuevo.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.passwordNueva !== form.passwordRepetir) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, passwordNueva: form.passwordNueva }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al restablecer la contraseña.");
    } else {
      setExito(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-brand-900 to-accent-900 px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center mb-8 hover:opacity-80 transition-opacity">
          <LogoEstrella />
        </Link>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {exito ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">¡Contraseña actualizada!</h1>
              <p className="text-gray-500 text-sm mb-6">
                Ya podés iniciar sesión con tu nueva contraseña.
              </p>
              <Link href="/login" className="btn-primary text-center block">
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Nueva contraseña</h1>
              <p className="text-gray-500 text-sm mb-6">Ingresá tu nueva contraseña.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      className="input pr-10"
                      placeholder="Mínimo 8 caracteres, 1 mayúscula y 1 número"
                      value={form.passwordNueva}
                      onChange={(e) => setForm({ ...form, passwordNueva: e.target.value })}
                      required
                      disabled={!!error && !loading}
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

                <div>
                  <label className="label">Repetir contraseña</label>
                  <input
                    type={showPass ? "text" : "password"}
                    className="input"
                    value={form.passwordRepetir}
                    onChange={(e) => setForm({ ...form, passwordRepetir: e.target.value })}
                    required
                    disabled={!!error && !loading}
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                    {error.includes("inválido") && (
                      <Link href="/olvide-contrasena" className="underline ml-1">Solicitar nuevo enlace</Link>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || (!!error && error.includes("inválido"))}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    : "Guardar nueva contraseña"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NuevaContrasenaPage() {
  return (
    <Suspense>
      <NuevaContrasenaContent />
    </Suspense>
  );
}
