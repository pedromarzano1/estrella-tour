import Link from "next/link";
import { prisma } from "@/lib/db";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";
import { AdminViajesClient } from "@/components/admin/AdminViajesClient";
import { AdminViajesRecurrentesClient } from "@/components/admin/AdminViajesRecurrentesClient";

export default async function AdminViajesPage() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [viajesRaw, recurrentes] = await Promise.all([
    prisma.viaje.findMany({
      where: { estado: "ACTIVO", horarioSalida: { gte: hoy }, viajeRecurrenteId: null },
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
