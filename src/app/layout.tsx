import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppFloat } from "@/components/public/WhatsAppFloat";

export const metadata: Metadata = {
  title: "Estrella Tour — Reservas Online",
  description:
    "Reservá tu asiento en línea. Viajes diarios entre Mercedes y Buenos Aires. Más de 16 años de confianza.",
  keywords: "estrella tour, mercedes buenos aires, colectivo, micro, reservas online",
  openGraph: {
    title: "Estrella Tour",
    description: "Viajes entre Mercedes y Buenos Aires. Reservás online en minutos.",
    url: "https://estrellatour.com.ar",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Estrella Tour",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        {children}
        <WhatsAppFloat />
      </body>
    </html>
  );
}
