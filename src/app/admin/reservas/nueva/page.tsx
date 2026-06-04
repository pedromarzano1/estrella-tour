import { prisma } from "@/lib/db";
import { NuevaReservaAdminForm } from "@/components/admin/NuevaReservaAdminForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EstadoAsiento } from "@prisma/client";

interface Props {
  searchParams: Promise<{ userId?: string; nombre?: string }>;
}

async function sincronizarPasajerosFijos() {
  const pasajerosFijos = await prisma.pasajeroFijo.findMany({
    where: { activo: true },
    include: {
      viajeRecurrente: {
        include: {
          viajes: {
            where: { horarioSalida: { gte: new Date() }, estado: "ACTIVO" },
            include: { asientos: { where: { estado: EstadoAsiento.DISPONIBLE }, orderBy: { numero: "asc" } } },
          },
        },
      },
    },
  });

  for (const pf of pasajerosFijos) {
    for (const viaje of pf.viajeRecurrente.viajes) {
      const yaReservado = await prisma.reserva.findFirst({
        where: { userId: pf.userId, viajeId: viaje.id, estadoReserva: "CONFIRMADA" },
      });
      if (yaReservado || viaje.asientos.length === 0) continue;
      const asiento = viaje.asientos[0];
      await prisma.asiento.update({ where: { id: asiento.id }, data: { estado: EstadoAsiento.RESERVADO } });
      await prisma.reserva.create({
        data: { userId: pf.userId, viajeId: viaje.id, asientoId: asiento.id, metodoPago: "EFECTIVO", monto: viaje.precio },
      });
    }
  }
}

export default async function NuevaReservaAdminPage({ searchParams }: Props) {
  const { userId } = await searchParams;

  await sincronizarPasajerosFijos();

  const [viajes, usuario] = await Promise.all([
    prisma.viaje.findMany({
      where: { estado: "ACTIVO", horarioSalida: { gte: new Date() } },
      include: {
        asientos: { orderBy: { numero: "asc" } },
        vehiculo: { select: { descripcion: true } },
      },
      orderBy: { horarioSalida: "asc" },
    }),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, nombre: true, email: true },
        })
      : null,
  ]);

  const serialized = viajes.map((v) => ({
    id: v.id,
    origen: v.origen,
    destino: v.destino,
    horarioSalida: v.horarioSalida.toISOString(),
    precio: v.precio,
    vehiculo: v.vehiculo.descripcion,
    asientos: v.asientos.map((a) => ({ id: a.id, numero: a.numero, disponible: a.estado === "DISPONIBLE" })),
    viajeRecurrenteId: v.viajeRecurrenteId,
  }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/usuarios" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crear Reserva</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Para pasajeros que reservan por WhatsApp o en persona.
          </p>
        </div>
      </div>

      <NuevaReservaAdminForm
        viajes={serialized}
        usuarioPreseleccionado={usuario}
      />
    </div>
  );
}
