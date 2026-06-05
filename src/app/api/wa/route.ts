import { NextRequest, NextResponse } from "next/server";

// Números mapeados server-side — el cliente nunca ve el número real en el HTML
const WA_MAP: Record<string, string> = {
  mercedes1: "542324504000",
  mercedes2: "542324560139",
  bsas: "541122663000",
};

const DEFAULT_MSG = "Hola Estrella Tour! Quisiera consultar sobre los viajes disponibles.";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("to") ?? "";
  const msg = searchParams.get("msg") ?? DEFAULT_MSG;

  const numero = WA_MAP[key];
  if (!numero) {
    return NextResponse.json({ error: "Destino inválido" }, { status: 400 });
  }

  // Sanitizar msg: solo texto plano, sin URLs ni inyección
  const msgLimpio = msg.slice(0, 300).replace(/[<>"]/g, "");

  const waUrl = `https://wa.me/${numero}?text=${encodeURIComponent(msgLimpio)}`;

  return NextResponse.redirect(waUrl, { status: 302 });
}
