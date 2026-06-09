import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "et_session";

// Rutas que requieren estar logueado como usuario
const PROTECTED_USER = ["/mis-reservas", "/reservar", "/mi-cuenta"];
// Rutas que requieren ser admin
const PROTECTED_ADMIN = ["/admin"];
// Rutas de auth (redirigen si ya está logueado)
const AUTH_ROUTES = ["/login", "/registro"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  const isAdminRoute = PROTECTED_ADMIN.some((r) => pathname.startsWith(r));
  const isUserRoute = PROTECTED_USER.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Agregar headers de seguridad a todas las respuestas
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.mercadopago.com https://api.resend.com",
      "frame-src https://www.mercadopago.com.ar https://www.mercadopago.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  if (!token) {
    if (isAdminRoute || isUserRoute) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  // Para rutas de admin verificamos el rol via cookie (se setea en login)
  const userRol = req.cookies.get("et_rol")?.value;
  if (isAdminRoute && userRol !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/pagos/webhook).*)",
  ],
};
