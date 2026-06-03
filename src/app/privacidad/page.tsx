import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getSession } from "@/lib/auth";
import { ShieldCheck } from "lucide-react";

export default async function PrivacidadPage() {
  const user = await getSession();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user ? { nombre: user.nombre, rol: user.rol } : null} />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-7 h-7 text-brand-700" />
            <h1 className="text-3xl font-bold text-gray-900">Política de Privacidad</h1>
          </div>
          <p className="text-sm text-gray-400 mb-8">Última actualización: 02/01/2026</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 text-sm leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. Introducción</h2>
              <p>
                Estrella Tour (en adelante, "la Empresa", "nosotros", "nuestro") se compromete a proteger la privacidad
                de sus usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos
                su información personal de acuerdo con la Ley de Protección de Datos Personales N° 25.326 de Argentina
                y el Reglamento General de Protección de Datos (RGPD) cuando corresponda.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Información que Recopilamos</h2>
              <p className="mb-4">Recopilamos la siguiente información personal cuando usted utiliza nuestros servicios:</p>

              <h3 className="font-semibold text-gray-800 mb-2">2.1. Información de Identificación</h3>
              <ul className="list-disc list-inside space-y-1 pl-2 mb-4">
                <li>Nombre completo</li>
                <li>Dirección de correo electrónico</li>
                <li>Número de teléfono celular (opcional)</li>
                <li>Contraseña (almacenada de forma cifrada, nunca en texto plano)</li>
              </ul>
              <p className="text-xs text-gray-500 mb-4 italic">
                Nota: nuestro sistema NO recopila DNI, fecha de nacimiento ni datos de sexo.
              </p>

              <h3 className="font-semibold text-gray-800 mb-2">2.2. Información de Transacciones</h3>
              <ul className="list-disc list-inside space-y-1 pl-2 mb-4">
                <li>Historial de reservas (viaje, asiento, fecha)</li>
                <li>Método de pago seleccionado (Mercado Pago o efectivo)</li>
                <li>Estado del pago (pendiente, pagado, en proceso)</li>
                <li>Monto de la reserva</li>
                <li>Identificadores de transacción de Mercado Pago (cuando aplica)</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mb-2">2.3. Información Técnica</h3>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Cookie de sesión (httpOnly, no accesible por JavaScript, se elimina al cerrar sesión)</li>
                <li>Dirección IP (almacenada temporalmente para protección contra accesos abusivos)</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 italic">
                No utilizamos cookies de seguimiento, publicidad ni analítica de terceros.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. Cómo Utilizamos su Información</h2>
              <p className="mb-2">Utilizamos su información personal para los siguientes propósitos:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Procesar y gestionar sus reservas y compras de pasajes</li>
                <li>Enviar confirmaciones de reserva por correo electrónico</li>
                <li>Enviar recordatorios de pago pendiente (24 y 12 horas antes del viaje)</li>
                <li>Notificar cancelaciones de reservas o viajes</li>
                <li>Permitir al administrador gestionar pasajeros y viajes</li>
                <li>Prevenir fraudes y garantizar la seguridad del sistema (limitación de intentos de acceso)</li>
                <li>Cumplir con obligaciones legales y regulatorias</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. Comunicaciones por Correo Electrónico</h2>
              <p className="mb-2">
                Nuestro sistema envía únicamente correos electrónicos de carácter transaccional, es decir, directamente
                relacionados con su actividad en la plataforma:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 mb-3">
                <li>Confirmación de nueva reserva</li>
                <li>Aviso de cancelación de reserva</li>
                <li>Recordatorio de pago pendiente 24 horas antes del viaje</li>
                <li>Recordatorio de pago pendiente 12 horas antes del viaje</li>
              </ul>
              <p className="text-gray-500 text-xs italic">
                No enviamos correos promocionales, publicitarios ni boletines de marketing sin su consentimiento
                explícito. Los correos se envían desde reservas@estrellatour.com.ar.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. Compartir Información con Terceros</h2>
              <p className="mb-3">
                No vendemos ni alquilamos su información personal a terceros. Compartimos datos únicamente con los
                siguientes proveedores de servicios necesarios para el funcionamiento de la plataforma:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>Supabase</strong>: base de datos donde se almacena su información (servidores en Sudamérica)</li>
                <li><strong>Vercel</strong>: plataforma de hosting de la aplicación web</li>
                <li><strong>Mercado Pago</strong>: procesamiento de pagos online (cuando selecciona ese método)</li>
                <li><strong>Google (Gmail)</strong>: envío de correos electrónicos transaccionales</li>
              </ul>
              <p className="mt-3">
                Todos estos proveedores operan bajo sus propias políticas de privacidad y acuerdos de confidencialidad.
                También podemos divulgar información cuando sea requerido por ley, orden judicial o autoridad gubernamental.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. Seguridad de los Datos</h2>
              <p className="mb-2">
                Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 mb-3">
                <li>Cifrado de contraseñas con bcrypt (no almacenamos contraseñas en texto plano)</li>
                <li>Transmisión de datos cifrada mediante SSL/TLS</li>
                <li>Sesiones con cookies httpOnly (no accesibles desde JavaScript)</li>
                <li>Almacenamiento en base de datos con Row Level Security (RLS) activado</li>
                <li>Protección contra ataques de fuerza bruta (límite de intentos de inicio de sesión)</li>
                <li>Acceso restringido a datos solo para personal autorizado</li>
              </ul>
              <p className="text-gray-500 text-xs italic">
                Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro.
                Aunque nos esforzamos por proteger su información, no podemos garantizar seguridad absoluta.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. Retención de Datos</h2>
              <p>
                Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos descritos
                en esta política. Los datos de reservas se conservan por razones operativas y legales. Si desea eliminar
                su cuenta y los datos asociados, puede solicitarlo contactándonos directamente; procederemos a la
                eliminación salvo que exista obligación legal de conservarlos.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. Sus Derechos</h2>
              <p className="mb-2">
                De acuerdo con la Ley de Protección de Datos Personales N° 25.326, usted tiene derecho a:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>Acceso:</strong> solicitar una copia de la información personal que tenemos sobre usted</li>
                <li><strong>Rectificación:</strong> corregir información inexacta o incompleta desde su perfil</li>
                <li><strong>Supresión:</strong> solicitar la eliminación de su cuenta e información personal</li>
                <li><strong>Oposición:</strong> oponerse al procesamiento de sus datos para ciertos propósitos</li>
                <li><strong>Portabilidad:</strong> recibir sus datos en un formato estructurado y de uso común</li>
              </ul>
              <p className="mt-2">Para ejercer estos derechos, contáctenos a través de los medios indicados al final de este documento.</p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">9. Cookies</h2>
              <p className="mb-2">
                Nuestro sitio utiliza únicamente la cookie de sesión estrictamente necesaria para el funcionamiento del
                sistema:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2 mb-3">
                <li><strong>et_session</strong>: mantiene su sesión activa mientras navega. Es httpOnly (no accesible por JavaScript) y se elimina al cerrar sesión o al expirar.</li>
              </ul>
              <p className="text-gray-500 text-xs italic">
                No utilizamos cookies de analítica (Google Analytics, etc.), publicidad ni seguimiento de terceros.
                No necesitamos mostrar un banner de cookies ya que solo usamos las estrictamente necesarias.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">10. Menores de Edad</h2>
              <p>
                Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos intencionalmente
                información personal de menores de edad sin el consentimiento de sus padres o tutores legales. Si
                descubrimos que hemos recopilado información de un menor sin consentimiento, tomaremos medidas para
                eliminar esa información.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">11. Cambios a esta Política</h2>
              <p>
                Podemos actualizar esta Política de Privacidad periódicamente. Le notificaremos sobre cambios
                significativos publicando la nueva política en esta página y actualizando la fecha de "Última
                actualización". Le recomendamos revisar esta política periódicamente.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">12. Registro Nacional de Bases de Datos</h2>
              <p>
                De acuerdo con la Ley de Protección de Datos Personales N° 25.326, nuestra base de datos está inscripta
                en el Registro Nacional de Bases de Datos de la Dirección Nacional de Protección de Datos Personales.
                Número de registro: <span className="text-gray-400 italic">[a completar]</span>.
              </p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">13. Contacto</h2>
              <p className="mb-2">
                Si tiene preguntas, preocupaciones o solicitudes relacionadas con esta Política de Privacidad o el
                tratamiento de sus datos personales, puede contactarnos a través de:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>Email:</strong> estrealltour.soporte@gmail.com</li>
                <li><strong>WhatsApp:</strong> 2324-504000 / 2324-560139 / 11-22663000</li>
                <li><strong>Zona de operación:</strong> Mercedes, Provincia de Buenos Aires, Argentina</li>
              </ul>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
