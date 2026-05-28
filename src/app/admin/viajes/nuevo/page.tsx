import { prisma } from "@/lib/db";
import { NuevoViajeForm } from "@/components/admin/NuevoViajeForm";

export default async function NuevoViajePage() {
  const vehiculos = await prisma.vehiculo.findMany({
    where: { activo: true },
    orderBy: { descripcion: "asc" },
  });

  const serialized = vehiculos.map((v) => ({
    id: v.id,
    patente: v.patente,
    descripcion: v.descripcion,
    capacidad: v.capacidad,
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Viaje</h1>
      <NuevoViajeForm vehiculos={serialized} />
    </div>
  );
}
