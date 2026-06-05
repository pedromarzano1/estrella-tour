import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  // Next.js necesita unsafe-inline/eval para sus scripts internos sin nonce
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://http2.mlstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.mercadopago.com https://api.mlstatic.com",
  "frame-src https://www.mercadopago.com.ar https://www.mercadopago.com https://www.mercadolibre.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Evita clickjacking — la app no necesita ser embebida en iframes externos
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Anti-clickjacking (doble capa con CSP frame-ancestors)
  { key: "X-Frame-Options", value: "DENY" },
  // Evita MIME-type sniffing (vector XSS en uploads)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limita info de referrer a orígenes propios
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva features de navegador que no se usan
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Fuerza HTTPS por 2 años — solo activar cuando el dominio tenga cert válido
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "estrellatour.com.ar" },
    ],
  },
  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {},
};

export default nextConfig;
