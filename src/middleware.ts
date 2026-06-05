import { NextRequest, NextResponse } from "next/server";

const ADMIN_PATHS = ["/admin", "/api/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protección de rutas admin: verificar cookie de sesión presente
  // La validación real (token en DB + rol) ocurre en getSessionFromRequest dentro de cada route handler.
  // Este check es defensa en profundidad para detener bots que ni siquiera tienen cookie.
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));
  if (isAdminPath) {
    const sessionToken = req.cookies.get("et_session")?.value;
    const rol = req.cookies.get("et_rol")?.value;

    if (!sessionToken || rol !== "ADMIN") {
      // API → 401 JSON; páginas → redirect al login
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const res = NextResponse.next();

  // Cabecera anti-cacheo para rutas de la API (evita que proxies/CDN cacheen respuestas autenticadas)
  if (pathname.startsWith("/api/")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.headers.set("Pragma", "no-cache");
  }

  return res;
}

export const config = {
  matcher: [
    // Protege /admin y /api/admin; también aplica a /api/* para Cache-Control
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/:path*",
  ],
};
