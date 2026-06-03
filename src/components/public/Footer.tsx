import { Phone, Mail, Clock } from "lucide-react";
import Image from "next/image";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-3 inline-block bg-white rounded-lg px-3 py-1">
              <Image src="/logo-estrella.webp" alt="Estrella Tour" width={160} height={52} className="h-11 w-auto" />
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Más de 16 años conectando Mercedes con Buenos Aires. Viajá con comodidad y seguridad.
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li className="flex items-center gap-2">
                <WhatsAppIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href="https://wa.me/542324504000" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">2324-504000</a>
              </li>
              <li className="flex items-center gap-2">
                <WhatsAppIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href="https://wa.me/542324560139" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">2324-560139</a>
              </li>
              <li className="flex items-center gap-2">
                <WhatsAppIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
                <a href="https://wa.me/541122663000" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">11-22663000</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:estrealltour.soporte@gmail.com" className="hover:text-white transition-colors">estrealltour.soporte@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* Horarios */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Horarios de Atención
            </h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex justify-between">
                <span>Lunes a Viernes</span>
                <span>4:30 - 21:00</span>
              </li>
              <li className="flex justify-between">
                <span>Sábados</span>
                <span>8:00 - 20:00</span>
              </li>
              <li className="flex justify-between">
                <span>Domingos</span>
                <span>9:00 - 22:30</span>
              </li>
            </ul>
            <p className="text-slate-400 text-xs mt-4">Las reservas online están disponibles las 24 horas.</p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Estrella Tour. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</Link>
            <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
