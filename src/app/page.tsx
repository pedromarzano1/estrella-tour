import Link from "next/link";
import { Shield, Clock, MapPin, CreditCard, CheckCircle, Bus } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getSession();

  if (user?.rol === "ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user ? { nombre: user.nombre, rol: user.rol } : null} />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-red-600 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-400 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Viajá con
              <span className="text-[#267a11]"> Estrella Tour</span>
            </h1>
            <p className="text-xl text-brand-200 mb-10 leading-relaxed">
              Conectamos Mercedes con Buenos Aires todos los días.<br />
              Reservá tu asiento online en minutos y pagá como quieras.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/viajes"
                className="bg-white hover:bg-gray-100 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 hover:scale-105 text-center shadow-lg"
              >
                Ver Viajes Disponibles
              </Link>
              <a
                href={`https://wa.me/542324504000?text=${encodeURIComponent("¡Buenas! Quisiera consultar sobre los viajes disponibles.")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-200"
              >
                <WhatsAppIcon className="w-5 h-5 text-green-400" />
                Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Ruta */}
      <section className="bg-brand-700 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-center">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-lg">Mercedes</span>
              <span className="text-brand-300">(Pcia. de Buenos Aires)</span>
            </div>
            <div className="text-2xl font-light text-brand-300">⟺</div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-lg">Ciudad de Buenos Aires</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-brand-900 mb-4">¿Por qué viajar con nosotros?</h2>
          <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
            Más de 16 años brindando servicio de transporte con seguridad y comodidad.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: CreditCard,
                title: "Múltiples formas de pago",
                desc: "Pagá con Mercado Pago (tarjeta, débito, QR) o en efectivo directamente en el colectivo.",
                color: "bg-accent-50 text-accent-600",
              },
              {
                icon: Shield,
                title: "Reserva segura",
                desc: "Tu asiento queda garantizado. Podés cancelar hasta 24 horas antes sin complicaciones.",
                color: "bg-green-50 text-green-600",
              },
              {
                icon: Clock,
                title: "Reservas 24/7",
                desc: "El sistema de reservas está disponible las 24 horas. Reservá cuando quieras desde cualquier dispositivo.",
                color: "bg-purple-50 text-purple-600",
              },
              {
                icon: WhatsAppIcon,
                title: "Atención por WhatsApp",
                desc: "¿Preferís reservar por mensaje? Escribinos a cualquiera de nuestros números de WhatsApp.",
                color: "bg-green-50 text-green-600",
              },
              {
                icon: Bus,
                title: "Servicio diario",
                desc: "Múltiples salidas durante el día para que elijas el horario que más te convenga.",
                color: "bg-yellow-50 text-yellow-600",
              },
              {
                icon: CheckCircle,
                title: "Confirmación inmediata",
                desc: "Recibís un email con todos los datos de tu viaje ni bien confirmás la reserva.",
                color: "bg-brand-50 text-brand-700",
              },
            ].map((f) => (
              <div key={f.title} className="card hover:shadow-md transition-shadow bg-green-50 border border-green-200">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WhatsApp para adultos mayores */}
      <section className="py-16 bg-accent-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <WhatsAppIcon className="w-14 h-14 mx-auto mb-4 opacity-90" />
          <h2 className="text-3xl font-bold mb-4">¿Preferís reservar por WhatsApp?</h2>
          <p className="text-accent-100 text-lg mb-8 max-w-2xl mx-auto">
            Nuestro equipo te ayuda con la reserva por mensaje.<br />Escribinos y nos encargamos de todo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {[
              { numero: "542324504000", label: "2324-504000" },
              { numero: "542324560139", label: "2324-560139" },
              { numero: "541122663000", label: "11-22663000" },
            ].map((wa) => (
              <a
                key={wa.numero}
                href={`https://wa.me/${wa.numero}?text=${encodeURIComponent("Hola! Quisiera hacer una reserva.")}`}
                target="_blank"
                rel="noreferrer"
                className="bg-white text-accent-700 hover:bg-accent-50 font-bold px-6 py-3 rounded-xl transition-colors"
              >
                📱 {wa.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-slate-900 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">¿Listo para viajar?</h2>
          <p className="text-brand-200 mb-8">Elegí tu viaje y reservá tu asiento en menos de 2 minutos.</p>
          <Link
            href="/viajes"
            className="inline-block bg-accent-700 hover:bg-accent-600 text-white font-bold px-10 py-4 rounded-xl text-lg transition-all hover:scale-105"
          >
            Reservar Ahora
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
