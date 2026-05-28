import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionFromRequest(req);
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const viaje = await prisma.viaje.findUnique({
    where: { id },
    include: {
      reservas: {
        where: { estadoReserva: "CONFIRMADA" },
        include: {
          user: { select: { nombre: true, email: true, telefono: true } },
          asiento: { select: { numero: true } },
        },
        orderBy: { asiento: { numero: "asc" } },
      },
    },
  });

  if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 });

  const METODO: Record<string, string> = {
    MERCADO_PAGO: "Mercado Pago",
    EFECTIVO: "En la oficina",
  };
  const ESTADO: Record<string, string> = {
    APROBADO: "Pagado",
    PENDIENTE: "Pendiente",
    EN_PROCESO: "En proceso",
    RECHAZADO: "Rechazado",
  };

  const rows = viaje.reservas.map((r) => ({
    "N° Asiento": r.asiento.numero,
    "Nombre": r.user.nombre,
    "Email": r.user.email,
    "Teléfono": r.user.telefono ?? "",
    "Método de pago": METODO[r.metodoPago] ?? r.metodoPago,
    "Estado de pago": ESTADO[r.estadoPago] ?? r.estadoPago,
    "Monto ($)": r.monto,
    "Fecha de reserva": format(r.creadoEn, "dd/MM/yyyy HH:mm", { locale: es }),
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pasajeros");

  // Ancho de columnas
  ws["!cols"] = [
    { wch: 10 }, { wch: 30 }, { wch: 32 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 20 },
  ];

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const fecha = format(viaje.horarioSalida, "yyyy-MM-dd_HH-mm");
  const filename = `pasajeros_${viaje.origen}-${viaje.destino}_${fecha}.xlsx`
    .toLowerCase()
    .replace(/\s+/g, "_");

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
