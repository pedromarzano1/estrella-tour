import { prisma } from "@/lib/db";
import { AdminVehiculosClient } from "@/components/admin/AdminVehiculosClient";

export default async function AdminVehiculosPage() {
  const vehiculos = await prisma.vehiculo.findMany({
    include: { _count: { select: { viajes: true } } },
    orderBy: { creadoEn: "desc" },
  });

  const serialized = vehiculos.map((v) => ({
    id: v.id,
    patente: v.patente,
    descripcion: v.descripcion,
    capacidad: v.capacidad,
    activo: v.activo,
    totalViajes: v._count.viajes,
  }));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Vehículos</h1>
      <AdminVehiculosClient vehiculos={serialized} />
    </div>
  );
}
