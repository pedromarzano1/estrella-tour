import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { ReservaForm } from "@/components/public/ReservaForm";
import { formatearFecha, formatearHora, formatearPrecio } from "@/lib/utils";
import { MapPin, Clock, Bus, CreditCard } from "lucide-react";
import { EstadoViaje } from "@prisma/client";

interface Props {
  params: Promise<{ viajeId: string }>;
}

export default async function ReservarPage({ params }: Props) {
  const { viajeId } = await params;
  const user = await getSession();

  if (!user) {
    return redirect(`/login?callbackUrl=/reservar/${viajeId}`);
  }

  const viaje = await prisma.viaje.findUnique({
    where: { id: viajeId, estado: EstadoViaje.ACTIVO },
    include: {
      vehiculo: true,
      asientos: { orderBy: { numero: "asc" } },
    },
  });

  if (!viaje) notFound();

  if (viaje.horarioSalida < new Date()) {
    redirect("/viajes");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={{ nombre: user.nombre, rol: user.rol }} />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl font-bold text-brand-900 mb-6">Reservar Asiento</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detalle del viaje */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <h2 className="font-bold text-lg text-brand-900 mb-4">Detalle del Viaje</h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-brand-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Origen</p>
                        <p className="font-semibold">{viaje.origen}</p>
                      </div>
                    </div>
                    <div className="ml-6 my-1 text-gray-300 text-xs">↓</div>
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400">Destino</p>
                        <p className="font-semibold">{viaje.destino}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Horario de salida</p>
                      <p className="font-semibold">{formatearFecha(viaje.horarioSalida)}</p>
                      <p className="text-brand-700 font-bold text-lg">{formatearHora(viaje.horarioSalida)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Bus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Vehículo</p>
                      <p className="font-medium text-sm">{viaje.vehiculo.descripcion}</p>
                    </div>
                  </div>

                  <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-brand-600" />
                      <p className="text-xs text-brand-600 font-medium">Precio por asiento</p>
                    </div>
                    <p className="text-3xl font-bold text-brand-800 mt-1">{formatearPrecio(viaje.precio)}</p>
                  </div>

                  {viaje.observaciones && (
                    <p className="text-sm text-gray-500 italic">{viaje.observaciones}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Formulario de reserva */}
            <div className="lg:col-span-2">
              <ReservaForm
                viaje={{
                  id: viaje.id,
                  origen: viaje.origen,
                  destino: viaje.destino,
                  horarioSalida: viaje.horarioSalida.toISOString(),
                  precio: viaje.precio,
                  asientos: viaje.asientos,
                }}
                user={{ nombre: user.nombre, email: user.email }}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
