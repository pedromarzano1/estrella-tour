import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getSession } from "@/lib/auth";
import { FileText } from "lucide-react";

export default async function TerminosPage() {
  const user = await getSession();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user ? { nombre: user.nombre, rol: user.rol } : null} />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-7 h-7 text-brand-700" />
            <h1 className="text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
          </div>
          <p className="text-sm text-gray-400 mb-8">Última actualización: 02/01/2026</p>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8 text-gray-700 text-sm leading-relaxed">

            {/* 1 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar los servicios de Estrella Tour (en adelante, "la Empresa", "nosotros", "nuestro"),
                usted acepta cumplir con estos términos y condiciones. Si no está de acuerdo con alguna parte de estos
                términos, no debe utilizar nuestros servicios.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">2. Descripción del Servicio</h2>
              <p className="mb-3">
                Estrella Tour es una empresa de transporte de pasajeros en autobús que opera en Argentina, conectando
                Mercedes (Pcia. de Buenos Aires) con Ciudad de Buenos Aires. Ofrecemos servicios de reserva, compra y
                gestión de pasajes a través de nuestra plataforma digital y por vía telefónica/WhatsApp.
              </p>
              <p className="mb-2 font-medium text-gray-800">Nuestros servicios incluyen, pero no se limitan a:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Reserva y compra de pasajes de autobús de forma online</li>
                <li>Gestión de viajes y reservas desde la plataforma digital</li>
                <li>Información sobre rutas y horarios disponibles</li>
                <li>Servicio de atención al cliente por WhatsApp y correo electrónico</li>
                <li>Pago online mediante Mercado Pago o en efectivo en el vehículo</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">3. Registro de Usuario</h2>
              <p className="mb-2">
                Para utilizar ciertos servicios de nuestra plataforma, deberá registrarse y crear una cuenta. Al
                registrarse, usted se compromete a:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Proporcionar información veraz, precisa y completa sobre su identidad</li>
                <li>Mantener y actualizar su información de registro de manera oportuna</li>
                <li>Mantener la confidencialidad de su contraseña y cuenta</li>
                <li>Ser responsable de todas las actividades que ocurran bajo su cuenta</li>
                <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">4. Reservas y Pagos</h2>
              <p className="mb-2">Al realizar una reserva a través de nuestra plataforma:</p>
              <ul className="list-disc list-inside space-y-1 pl-2 mb-3">
                <li>Usted acepta pagar el precio total indicado para el servicio reservado</li>
                <li>Los precios están sujetos a cambios sin previo aviso hasta que se complete la transacción</li>
                <li>Las reservas están sujetas a disponibilidad y confirmación por parte de Estrella Tour</li>
                <li>Una vez confirmada la reserva, recibirá un comprobante por correo electrónico</li>
              </ul>
              <p className="mb-2 font-medium text-gray-800">Métodos de pago aceptados:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong>Mercado Pago</strong>: tarjeta de crédito, débito, QR o transferencia</li>
                <li><strong>Efectivo</strong>: pago directamente al conductor en el vehículo el día del viaje</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">5. Política de Cancelación y Reembolsos</h2>
              <p className="mb-2">Las políticas de cancelación y reembolso se aplican según las siguientes condiciones:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Las cancelaciones deben realizarse con al menos <strong>24 horas</strong> de anticipación para ser elegibles para reembolso</li>
                <li>Los reembolsos están sujetos a cargos administrativos según corresponda</li>
                <li>Las cancelaciones realizadas después del plazo establecido no serán elegibles para reembolso</li>
                <li>En caso de cancelación por parte de Estrella Tour, se ofrecerá un reembolso completo o alternativa de viaje</li>
                <li>Las cancelaciones pueden realizarse desde la sección "Mis Reservas" de la plataforma o contactándonos directamente</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">6. Notificaciones del Sistema</h2>
              <p className="mb-2">
                Al registrarse y realizar reservas, usted acepta recibir comunicaciones electrónicas por parte de
                Estrella Tour, incluyendo:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Confirmación de reserva al momento de realizarla</li>
                <li>Recordatorio de pago 24 horas antes del viaje (para pagos pendientes)</li>
                <li>Recordatorio de pago 12 horas antes del viaje (para pagos pendientes)</li>
                <li>Notificación de cancelación de reserva o viaje</li>
              </ul>
              <p className="mt-2 text-gray-500 text-xs">
                Estos correos se envían desde reservas@estrellatour.com.ar. Le recomendamos agregar esta dirección a sus
                contactos para evitar que lleguen a spam.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">7. Uso Aceptable</h2>
              <p className="mb-2">Usted se compromete a utilizar nuestros servicios de manera legal y apropiada. Está prohibido:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Utilizar nuestros servicios para cualquier propósito ilegal o no autorizado</li>
                <li>Intentar acceder a áreas restringidas de nuestra plataforma</li>
                <li>Interferir o interrumpir el funcionamiento de nuestros servicios</li>
                <li>Realizar reservas falsas o fraudulentas</li>
                <li>Transferir o revender pasajes sin autorización previa de Estrella Tour</li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">8. Limitación de Responsabilidad</h2>
              <p className="mb-2">Estrella Tour no será responsable por:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Retrasos, cancelaciones o cambios en los servicios de transporte debido a circunstancias fuera de nuestro control (clima, accidentes, cortes de ruta, etc.)</li>
                <li>Daños o pérdidas de equipaje, salvo los casos previstos por la ley</li>
                <li>Lesiones personales que no sean resultado directo de negligencia de la empresa</li>
                <li>Pérdidas indirectas, incidentales o consecuentes derivadas del uso de nuestros servicios</li>
                <li>Interrupciones temporales en la disponibilidad de la plataforma digital por mantenimiento o causas técnicas</li>
              </ul>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">9. Propiedad Intelectual</h2>
              <p>
                Todo el contenido de esta plataforma, incluyendo pero no limitado a textos, gráficos, logotipos, iconos,
                imágenes y software, es propiedad de Estrella Tour o sus proveedores de contenido y está protegido por
                las leyes de propiedad intelectual de Argentina. Queda prohibida su reproducción total o parcial sin
                autorización expresa de la empresa.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">10. Modificaciones de los Términos</h2>
              <p>
                Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. Las
                modificaciones entrarán en vigor inmediatamente después de su publicación en esta página. Es su
                responsabilidad revisar periódicamente estos términos. El uso continuado de nuestros servicios
                tras la publicación de cambios implica la aceptación de los nuevos términos.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">11. Ley Aplicable y Jurisdicción</h2>
              <p>
                Estos términos y condiciones se rigen por las leyes de la República Argentina. Cualquier disputa
                relacionada con estos términos o nuestros servicios será resuelta en los tribunales competentes de
                Mercedes, Provincia de Buenos Aires, Argentina.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-3">12. Contacto</h2>
              <p className="mb-2">Si tiene preguntas sobre estos términos y condiciones, puede contactarnos a través de:</p>
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
