import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { MisReservasClient } from "@/components/public/MisReservasClient";

export default async function MisReservasPage() {
  const user = await getSession();
  if (!user) redirect("/login?callbackUrl=/mis-reservas");

  const reservas = await prisma.reserva.findMany({
    where: { userId: user.id },
    include: {
      viaje: { include: { vehiculo: true } },
      asiento: true,
      pago: true,
    },
    orderBy: { creadoEn: "desc" },
  });

  const serialized = reservas.map((r) => ({
    ...r,
    creadoEn: r.creadoEn.toISOString(),
    actualizadoEn: r.actualizadoEn.toISOString(),
    canceladaEn: r.canceladaEn?.toISOString() ?? null,
    viaje: {
      ...r.viaje,
      horarioSalida: r.viaje.horarioSalida.toISOString(),
      creadoEn: r.viaje.creadoEn.toISOString(),
      actualizadoEn: r.viaje.actualizadoEn.toISOString(),
    },
    pago: r.pago
      ? {
          ...r.pago,
          creadoEn: r.pago.creadoEn.toISOString(),
          actualizadoEn: r.pago.actualizadoEn.toISOString(),
        }
      : null,
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={{ nombre: user.nombre, rol: user.rol }} />
      <main className="flex-1 bg-gray-50">
        <div className="bg-gradient-to-r from-brand-900 to-brand-700 text-white py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold">Mis Reservas</h1>
            <p className="text-brand-200 mt-1">Hola, {user.nombre.split(" ")[0]}. Aquí están todos tus viajes.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MisReservasClient reservas={serialized} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
