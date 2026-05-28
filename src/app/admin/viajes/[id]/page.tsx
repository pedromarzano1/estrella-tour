import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NuevoViajeForm } from "@/components/admin/NuevoViajeForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarViajePage({ params }: Props) {
  const { id } = await params;

  const [viaje, vehiculos] = await Promise.all([
    prisma.viaje.findUnique({ where: { id } }),
    prisma.vehiculo.findMany({ where: { activo: true }, orderBy: { descripcion: "asc" } }),
  ]);

  if (!viaje) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar Viaje</h1>
      <NuevoViajeForm
        vehiculos={vehiculos.map((v) => ({ id: v.id, patente: v.patente, descripcion: v.descripcion, capacidad: v.capacidad }))}
        viajeEditar={{
          id: viaje.id,
          origen: viaje.origen,
          destino: viaje.destino,
          horarioSalida: viaje.horarioSalida.toISOString(),
          precio: viaje.precio,
          vehiculoId: viaje.vehiculoId,
          observaciones: viaje.observaciones,
        }}
      />
    </div>
  );
}
