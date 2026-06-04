import { prisma } from "@/lib/db";
import { formatearPrecio } from "@/lib/utils";
import { TicketCheck, DollarSign, Bus, TrendingUp, AlertCircle } from "lucide-react";

import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const hoy = new Date();
  const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));

  const [
    totalReservas,
    reservasHoy,
    ingresosMp,
    viajesActivos,
    reservasPendientes,
    ultimasReservas,
  ] = await Promise.all([
    prisma.reserva.count({
      where: { estadoReserva: "CONFIRMADA", viaje: { horarioSalida: { gte: new Date() } } },
    }),
    prisma.reserva.count({
      where: {
        estadoReserva: "CONFIRMADA",
        creadoEn: { gte: inicioDia },
      },
    }),
    prisma.reserva.aggregate({
      where: { estadoPago: "APROBADO" },
      _sum: { monto: true },
    }),
    prisma.viaje.count({ where: { estado: "ACTIVO", horarioSalida: { gte: new Date() } } }),
    prisma.reserva.count({
      where: {
        estadoReserva: "CONFIRMADA",
        estadoPago: "PENDIENTE",
        viaje: { horarioSalida: { gte: new Date() } },
      },
    }),
    prisma.reserva.findMany({
      take: 10,
      orderBy: { viaje: { horarioSalida: "asc" } },
      where: {
        estadoReserva: "CONFIRMADA",
        viaje: { horarioSalida: { gte: new Date() } },
      },
      include: {
        user: { select: { nombre: true, email: true } },
        viaje: { select: { origen: true, destino: true, horarioSalida: true } },
        asiento: { select: { numero: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Reservas activas", value: totalReservas, icon: TicketCheck, color: "text-accent-600", bg: "bg-accent-50" },
    { label: "Reservas hoy", value: reservasHoy, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Ingresos MP", value: formatearPrecio(ingresosMp._sum.monto ?? 0), icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Viajes activos", value: viajesActivos, icon: Bus, color: "text-brand-700", bg: "bg-brand-50" },
  ];

  const ESTADO_PAGO_BADGE: Record<string, string> = {
    APROBADO: "badge-success",
    PENDIENTE: "badge-warning",
    EN_PROCESO: "badge-blue",
    RECHAZADO: "badge-danger",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link href="/admin/viajes/nuevo" className="btn-primary text-sm">
          + Nuevo Viaje
        </Link>
      </div>

      {/* Alerta pagos pendientes */}
      {reservasPendientes > 0 && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">
            Hay <strong>{reservasPendientes}</strong> reservas con pago pendiente.{" "}
            <Link href="/admin/reservas?filtro=pendiente" className="underline font-medium">Ver todas</Link>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Últimas reservas */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-gray-900">Últimas Reservas</h2>
          <Link href="/admin/reservas" className="text-sm text-brand-700 hover:underline">Ver todas</Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Pasajero</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Viaje</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Asiento</th>
                <th className="text-left py-2 pr-4 font-medium text-gray-500">Pago</th>
              </tr>
            </thead>
            <tbody>
              {ultimasReservas.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-gray-900">{r.user.nombre}</p>
                    <p className="text-xs text-gray-400">{r.user.email}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="text-gray-700">{r.viaje.origen} → {r.viaje.destino}</p>
                    <p className="text-xs text-gray-400">
                      {new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(r.viaje.horarioSalida)}
                    </p>
                  </td>
                  <td className="py-3 pr-4 font-medium text-gray-700">N° {r.asiento.numero}</td>
                  <td className="py-3">
                    <span className={ESTADO_PAGO_BADGE[r.estadoPago] ?? "badge-gray"}>
                      {r.estadoPago === "APROBADO" ? "✅ Pagado" :
                       r.estadoPago === "PENDIENTE" ? "⏳ Pendiente" :
                       r.estadoPago === "EN_PROCESO" ? "🔄 En proceso" : "❌ Rechazado"}
                    </span>
                  </td>
                </tr>
              ))}
              {ultimasReservas.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">Sin reservas aún</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
