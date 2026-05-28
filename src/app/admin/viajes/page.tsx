import Link from "next/link";
import { prisma } from "@/lib/db";
import { Plus } from "lucide-react";
import { AdminViajesClient } from "@/components/admin/AdminViajesClient";
import { AdminViajesRecurrentesClient } from "@/components/admin/AdminViajesRecurrentesClient";

export default async function AdminViajesPage() {
  const [viajesRaw, recurrentes] = await Promise.all([
    prisma.viaje.findMany({
      include: {
        vehiculo: { select: { descripcion: true, capacidad: true } },
        _count: { select: { asientos: { where: { estado: "DISPONIBLE" } } } },
      },
      orderBy: { horarioSalida: "asc" },
    }),
    prisma.viajeRecurrente.findMany({
      include: {
        vehiculo: { select: { descripcion: true, capacidad: true } },
        _count: {
          select: {
            viajes: { where: { horarioSalida: { gte: new Date() } } },
            pasajerosFijos: { where: { activo: true } },
          },
        },
      },
      orderBy: [{ diaSemana: "asc" }, { hora: "asc" }],
    }),
  ]);

  // ACTIVO primero, luego por horario ascendente
  const ESTADO_ORDER: Record<string, number> = { ACTIVO: 0, CANCELADO: 1, COMPLETADO: 2 };
  viajesRaw.sort((a, b) => {
    const diff = (ESTADO_ORDER[a.estado] ?? 3) - (ESTADO_ORDER[b.estado] ?? 3);
    if (diff !== 0) return diff;
    return a.horarioSalida.getTime() - b.horarioSalida.getTime();
  });

  const serialized = viajesRaw.map((v) => ({
    ...v,
    horarioSalida: v.horarioSalida.toISOString(),
    creadoEn: v.creadoEn.toISOString(),
    actualizadoEn: v.actualizadoEn.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Viajes</h1>
        <Link href="/admin/viajes/nuevo" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Nuevo Viaje
        </Link>
      </div>

      <AdminViajesClient viajes={serialized} />
      <AdminViajesRecurrentesClient recurrentes={recurrentes} />
    </div>
  );
}
