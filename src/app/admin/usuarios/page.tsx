import { prisma } from "@/lib/db";
import { AdminUsuariosClient } from "@/components/admin/AdminUsuariosClient";

export default async function AdminUsuariosPage() {
  const usuarios = await prisma.user.findMany({
    where: { rol: "USUARIO" },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      activo: true,
      creadoEn: true,
      _count: { select: { reservas: true } },
    },
    orderBy: { creadoEn: "desc" },
    take: 100,
  });

  const serialized = usuarios.map((u) => ({
    ...u,
    creadoEn: u.creadoEn.toISOString(),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Creá usuarios manualmente para clientes que reservan por WhatsApp.</p>
        </div>
      </div>
      <AdminUsuariosClient usuarios={serialized} />
    </div>
  );
}
