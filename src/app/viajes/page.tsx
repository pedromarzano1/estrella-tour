import { Calendar } from "lucide-react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ViajesClient } from "@/components/public/ViajesClient";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EstadoViaje } from "@prisma/client";

export const revalidate = 60;

export default async function ViajesPage() {
  const user = await getSession();

  const viajes = await prisma.viaje.findMany({
    where: {
      estado: EstadoViaje.ACTIVO,
      horarioSalida: { gte: new Date() },
    },
    include: {
      vehiculo: { select: { descripcion: true } },
      _count: { select: { asientos: { where: { estado: "DISPONIBLE" } } } },
    },
    orderBy: { horarioSalida: "asc" },
  });

  const serialized = viajes.map((v) => ({
    id: v.id,
    origen: v.origen,
    destino: v.destino,
    horarioSalida: v.horarioSalida.toISOString(),
    precio: v.precio,
    observaciones: v.observaciones,
    vehiculo: { descripcion: v.vehiculo.descripcion },
    asientosDisponibles: v._count.asientos,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user ? { nombre: user.nombre, rol: user.rol } : null} />

      <main className="flex-1">
        <div className="bg-gradient-to-r from-brand-800 to-accent-700 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Viajes Disponibles</h1>
            <p className="text-brand-200">Elegí el día y reservá tu asiento</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {serialized.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">No hay viajes disponibles</h2>
              <p className="text-gray-400">Por el momento no hay viajes programados. Consultá por WhatsApp.</p>
            </div>
          ) : (
            <ViajesClient viajes={serialized} isLoggedIn={!!user} />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
