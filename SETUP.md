# Guía de Setup — Estrella Tour Reservas

## Paso 1: Instalar dependencias
```bash
cd estrella-tour
npm install
```

## Paso 2: Crear la base de datos (Supabase — GRATIS)
1. Entrá a [supabase.com](https://supabase.com) y creá una cuenta
2. Creá un nuevo proyecto (elegí la región **South America - São Paulo**)
3. Una vez creado, andá a **Settings → Database**
4. Copiá la **Connection String** (Transaction Pooler) → es tu `DATABASE_URL`
5. Copiá la **Direct connection** → es tu `DIRECT_URL`

## Paso 3: Configurar variables de entorno
```bash
cp .env.example .env.local
```
Abrí `.env.local` y completá:
- `DATABASE_URL` y `DIRECT_URL` con los valores de Supabase
- `NEXT_PUBLIC_BASE_URL` con tu URL (en desarrollo: `http://localhost:3000`)

## Paso 4: Crear las tablas y el admin inicial
```bash
npm run db:push    # Crea las tablas en Supabase
npm run db:seed    # Crea el admin inicial y un vehículo de prueba
```
**Admin inicial:** el script de seed crea un usuario administrador. Por seguridad, las credenciales no se incluyen en esta guía: definí un email y una contraseña propios y seguros en el script de seed (o, preferentemente, mediante variables de entorno como `ADMIN_EMAIL` y `ADMIN_PASSWORD`) antes de ejecutarlo, y cambiá la contraseña en el primer ingreso.

## Paso 5: Configurar MercadoPago
1. Entrá a [mercadopago.com.ar](https://www.mercadopago.com.ar) con la cuenta del negocio
2. Andá a **Tu negocio → Credenciales**
3. Copiá el **Access Token** y el **Public Key** al `.env.local`
4. Para el webhook: andá a **Notificaciones → Webhooks** y agregá:
   - URL: `https://tu-dominio.vercel.app/api/pagos/webhook`
   - Eventos: `payment`
   - Copiá el **Secreto del webhook** al `.env.local` como `MP_WEBHOOK_SECRET`

## Paso 6: Configurar emails (Resend — GRATIS hasta 3000 emails/mes)
1. Creá cuenta en [resend.com](https://resend.com)
2. Verificá tu dominio (o usá `@resend.dev` para pruebas)
3. Creá una API Key y ponela en `.env.local` como `RESEND_API_KEY`

## Paso 7: Correr en desarrollo
```bash
npm run dev
```
Abrí [http://localhost:3000](http://localhost:3000)

## Paso 8: Deploy en Vercel
1. Subí el proyecto a GitHub
2. Importalo en [vercel.com](https://vercel.com)
3. Agregá todas las variables de entorno en **Settings → Environment Variables**
4. Deploy automático en cada push

---

## Flujo de uso del Admin
1. Ingresar en `/login` con las credenciales de admin
2. Crear vehículos en **Admin → Vehículos** (indicar patente, descripción y capacidad)
3. Crear viajes en **Admin → Viajes → Nuevo Viaje** (origen, destino, horario, precio, vehículo)
4. Ver reservas en **Admin → Reservas** con filtros por estado de pago
5. Los pagos de MercadoPago se confirman automáticamente via webhook

## Flujo del usuario
1. Ver viajes disponibles en `/viajes`
2. Hacer clic en **Reservar Asiento**
3. Si no está logueado, se pide login/registro
4. Seleccionar asiento en el plano del micro
5. Elegir método de pago (Mercado Pago / Efectivo / WhatsApp)
6. Recibe email de confirmación inmediato
7. Puede cancelar hasta 24h antes desde **Mis Reservas**

## Seguridad implementada
- Passwords hasheados con bcrypt (factor 12)
- Sesiones httpOnly con expiración de 7 días
- Rate limiting en login (5 intentos/min) y registro
- Verificación de firma en webhooks de MercadoPago
- Middleware que protege rutas de admin y usuario
- Transacciones atómicas en DB para evitar doble reserva
- Validación con Zod en todas las API routes
- Headers de seguridad (X-Frame-Options, CSP, HSTS)
- Nunca se exponen datos sensibles al cliente
