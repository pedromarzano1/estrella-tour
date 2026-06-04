import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
import { EditarRecurrenteForm } from "@/components/admin/EditarRecurrenteForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarRecurrentePage({ params }: Props) {
  const { id } = await params;

  const [recurrente, vehiculos] = await Promise.all([
    prisma.viajeRecurrente.findUnique({ where: { id } }),
    prisma.vehiculo.findMany({ where: { activo: true }, orderBy: { descripcion: "asc" } }),
  ]);

  if (!recurrente) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/viajes" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar Viaje Fijo</h1>
      </div>

      <EditarRecurrenteForm
        recurrente={{
          id: recurrente.id,
          origen: recurrente.origen,
          destino: recurrente.destino,
          diaSemana: recurrente.diaSemana,
          hora: recurrente.hora,
          precio: recurrente.precio,
          vehiculoId: recurrente.vehiculoId,
          observaciones: recurrente.observaciones,
        }}
        vehiculos={vehiculos.map((v) => ({
          id: v.id,
          patente: v.patente,
          descripcion: v.descripcion,
          capacidad: v.capacidad,
        }))}
      />
    </div>
  );
}
