import type { Metadata } from "next";
import "./globals.css";
import { WhatsAppFloat } from "@/components/public/WhatsAppFloat";
import { Lobster } from "next/font/google";

const lobster = Lobster({ weight: "400", subsets: ["latin"], variable: "--font-lobster" });

export const metadata: Metadata = {
  title: "Estrella Tour — Reservas Online",
  description:
    "Reservá tu asiento en línea. Viajes diarios entre Mercedes y Buenos Aires. Más de 16 años de confianza.",
  keywords: "estrella tour, mercedes buenos aires, colectivo, micro, reservas online",
  icons: {
    icon: [
      { url: "/logo-estrella.webp", type: "image/webp" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/logo-estrella.webp",
    shortcut: "/logo-estrella.webp",
  },
  openGraph: {
    title: "Estrella Tour",
    description: "Viajes entre Mercedes y Buenos Aires. Reservás online en minutos.",
    url: "https://estrella-tour.vercel.app",
    images: [
      {
        url: "https://estrella-tour.vercel.app/logo-estrella.webp",
        width: 400,
        height: 200,
        alt: "Estrella Tour",
      },
    ],
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
    <html lang="es" className={lobster.variable}>
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
