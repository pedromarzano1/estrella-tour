import { redirect } from "next/navigation";
import { getSession, isAdmin } from "@/lib/auth";
import Link from "next/link";
import { LayoutDashboard, Bus, MapPin, Users, LogOut, TicketCheck, UserCog } from "lucide-react";
import Image from "next/image";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user || !isAdmin(user)) redirect("/");

  return (
    <div className="min-h-screen flex bg-sky-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl shrink-0">
        <div className="p-6 border-b border-slate-800">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <Image src="/logo-estrella.webp" alt="Estrella Tour" width={130} height={43} className="h-9 w-auto" />
          </Link>
          <p className="text-slate-400 text-xs mt-1">Panel de Administración</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/admin/viajes", icon: MapPin, label: "Viajes" },
            { href: "/admin/vehiculos", icon: Bus, label: "Vehículos" },
            { href: "/admin/reservas", icon: TicketCheck, label: "Reservas" },
            { href: "/admin/usuarios", icon: Users, label: "Usuarios" },
            { href: "/admin/empleados", icon: UserCog, label: "Empleados" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-100 hover:text-white text-sm font-medium"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="mb-3 px-3">
            <p className="text-xs text-slate-400">Administrador</p>
            <p className="text-sm font-medium text-white truncate">{user.nombre}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
