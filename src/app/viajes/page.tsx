import Link from "next/link";
import { MapPin, Clock, Bus, ArrowRight, Calendar } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatearPrecio, formatearFecha, formatearHora } from "@/lib/utils";
import { EstadoViaje } from "@prisma/client";

export const revalidate = 60; // revalida cada 60s

export default async function ViajesPage() {
  const user = await getSession();

  const viajes = await prisma.viaje.findMany({
    where: {
      estado: EstadoViaje.ACTIVO,
      horarioSalida: { gte: new Date() },
    },
    include: {
      vehiculo: { select: { descripcion: true, capacidad: true } },
      _count: { select: { asientos: { where: { estado: "DISPONIBLE" } } } },
    },
    orderBy: { horarioSalida: "asc" },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user ? { nombre: user.nombre, rol: user.rol } : null} />

      <main className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-800 to-accent-700 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-2">Viajes Disponibles</h1>
            <p className="text-brand-200">Elegí tu horario y reservá tu asiento</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {viajes.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">No hay viajes disponibles</h2>
              <p className="text-gray-400">Por el momento no hay viajes programados. Consultá por WhatsApp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {viajes.map((viaje) => {
                const asientosDisponibles = viaje._count.asientos;
                const agotado = asientosDisponibles === 0;
                const pocosAsientos = asientosDisponibles <= 5 && asientosDisponibles > 0;

                return (
                  <div
                    key={viaje.id}
                    className={`card hover:shadow-lg transition-all duration-200 flex flex-col ${agotado ? "opacity-75" : ""}`}
                  >
                    {/* Ruta */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-brand-900">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="font-bold">{viaje.origen}</span>
                        </div>
                        <div className="ml-5 my-1 text-gray-400 text-xs">↓</div>
                        <div className="flex items-center gap-1.5 text-brand-900">
                          <MapPin className="w-4 h-4 flex-shrink-0 text-red-500" />
                          <span className="font-bold">{viaje.destino}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-brand-800">{formatearPrecio(viaje.precio)}</p>
                        <p className="text-xs text-gray-400">por persona</p>
                      </div>
                    </div>

                    {/* Horario */}
                    <div className="flex items-center gap-3 py-3 border-y border-gray-100 mb-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <div>
                          <p className="text-xs text-gray-400">Salida</p>
                          <p className="font-semibold text-sm">{formatearHora(viaje.horarioSalida)}</p>
                        </div>
                      </div>
                      <div className="flex-1" />
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{formatearFecha(viaje.horarioSalida)}</p>
                      </div>
                    </div>

                    {/* Micro y asientos */}
                    <div className="flex items-center gap-2 mb-4">
                      <Bus className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-500 truncate">{viaje.vehiculo.descripcion}</span>
                    </div>

                    {/* Badge asientos */}
                    <div className="mb-4">
                      {agotado ? (
                        <span className="badge-danger">Sin asientos disponibles</span>
                      ) : pocosAsientos ? (
                        <span className="badge-warning">⚡ Últimos {asientosDisponibles} asientos</span>
                      ) : (
                        <span className="badge-success">{asientosDisponibles} asientos disponibles</span>
                      )}
                    </div>

                    {viaje.observaciones && (
                      <p className="text-xs text-gray-400 italic mb-4">{viaje.observaciones}</p>
                    )}

                    <div className="mt-auto flex gap-2">
                      {agotado ? (
                        <div className="flex-1 text-center py-3 bg-gray-100 text-gray-400 rounded-lg font-medium text-sm">
                          Agotado
                        </div>
                      ) : user ? (
                        <Link
                          href={`/reservar/${viaje.id}`}
                          className="flex-1 btn-primary text-center flex items-center justify-center gap-2"
                        >
                          Reservar Asiento
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <Link
                          href={`/login?callbackUrl=/reservar/${viaje.id}`}
                          className="flex-1 btn-secondary text-center flex items-center justify-center gap-2"
                        >
                          Ingresar para reservar
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                      <a
                        href={`https://wa.me/542324504000?text=${encodeURIComponent(`Hola! Quisiera reservar el viaje del ${formatearFecha(viaje.horarioSalida)} a las ${formatearHora(viaje.horarioSalida)} de ${viaje.origen} a ${viaje.destino}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center"
                        title="Reservar por WhatsApp"
                      >
                        <WhatsAppIcon className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
