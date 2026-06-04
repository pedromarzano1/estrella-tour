import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import * as XLSX from "xlsx";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionFromRequest(req);
  if (!user || user.rol !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const recurrente = await prisma.viajeRecurrente.findUnique({
    where: { id },
    include: {
      pasajerosFijos: {
        where: { activo: true },
        include: {
          user: { select: { nombre: true, email: true, telefono: true } },
        },
        orderBy: { creadoEn: "asc" },
      },
    },
  });

  if (!recurrente) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });

  const rows = recurrente.pasajerosFijos.map((p) => ({
    "Nombre": p.user.nombre,
    "Email": p.user.email,
    "Teléfono": p.user.telefono ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pasajeros Fijos");

  ws["!cols"] = [{ wch: 30 }, { wch: 32 }, { wch: 16 }];

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const dia = DIAS[recurrente.diaSemana].toLowerCase();
  const filename = `pasajeros_fijos_${recurrente.origen}-${recurrente.destino}_${dia}_${recurrente.hora.replace(":", "")}.xlsx`
    .toLowerCase()
    .replace(/\s+/g, "_");

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
