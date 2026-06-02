import { prisma } from "@/lib/db";
import { AdminReservasClient } from "@/components/admin/AdminReservasClient";

export const dynamic = "force-dynamic";

export default async function AdminReservasPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const { filtro } = await searchParams;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const baseWhere = {
    estadoReserva: "CONFIRMADA" as const,
    viaje: { horarioSalida: { gte: hoy } },
  };

  const where =
    filtro === "pendiente"
      ? { ...baseWhere, estadoPago: "PENDIENTE" as const }
      : filtro === "aprobado"
      ? { ...baseWhere, estadoPago: "APROBADO" as const }
      : baseWhere;

  const reservas = await prisma.reserva.findMany({
    where,
    include: {
      user: { select: { nombre: true, email: true, telefono: true } },
      viaje: { select: { origen: true, destino: true, horarioSalida: true } },
      asiento: { select: { numero: true } },
      pago: { select: { mpPaymentId: true, estado: true } },
    },
    orderBy: { viaje: { horarioSalida: "asc" } },
    take: 200,
  });

  const serialized = reservas.map((r) => ({
    ...r,
    creadoEn: r.creadoEn.toISOString(),
    actualizadoEn: r.actualizadoEn.toISOString(),
    canceladaEn: r.canceladaEn?.toISOString() ?? null,
    viaje: {
      ...r.viaje,
      horarioSalida: r.viaje.horarioSalida.toISOString(),
    },
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reservas</h1>
      <AdminReservasClient reservas={serialized} filtroActivo={filtro} />
    </div>
  );
}
