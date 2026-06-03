"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import Image from "next/image";

interface NavbarProps {
  user?: { nombre: string; rol: string } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b-2 border-red-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <Image src="/logo-estrella.webp" alt="Estrella Tour" width={140} height={46} className="h-10 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/viajes" className="hover:text-yellow-300 transition-colors font-medium">
              Ver Viajes
            </Link>
            {user ? (
              <>
                {user.rol !== "ADMIN" && (
                  <>
                    <Link href="/mis-reservas" className="hover:text-yellow-300 transition-colors font-medium">
                      Mis Reservas
                    </Link>
                    <Link href="/mi-cuenta" className="hover:text-yellow-300 transition-colors font-medium">
                      Mi Cuenta
                    </Link>
                  </>
                )}
                {user.rol === "ADMIN" && (
                  <Link href="/admin" className="hover:text-yellow-300 transition-colors font-medium">
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-slate-300 text-sm flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {user.nombre.split(" ")[0]}
                  </span>
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Salir
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="hover:text-yellow-300 transition-colors font-medium">
                  Ingresar
                </Link>
                <Link
                  href="/registro"
                  className="bg-accent-500 text-white hover:bg-accent-400 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700 px-4 py-4 flex flex-col gap-3">
          <Link href="/viajes" onClick={() => setOpen(false)} className="font-medium hover:text-yellow-300">Ver Viajes</Link>
          {user ? (
            <>
              {user.rol !== "ADMIN" && (
                <>
                  <Link href="/mis-reservas" onClick={() => setOpen(false)} className="font-medium hover:text-yellow-300">Mis Reservas</Link>
                  <Link href="/mi-cuenta" onClick={() => setOpen(false)} className="font-medium hover:text-yellow-300">Mi Cuenta</Link>
                </>
              )}
              {user.rol === "ADMIN" && (
                <Link href="/admin" onClick={() => setOpen(false)} className="font-medium hover:text-yellow-300">Panel Admin</Link>
              )}
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-left font-medium text-red-300">Cerrar sesión</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="font-medium hover:text-yellow-300">Ingresar</Link>
              <Link href="/registro" onClick={() => setOpen(false)} className="font-medium hover:text-yellow-300">Registrarse</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
