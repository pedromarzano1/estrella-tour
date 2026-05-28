import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AdminEmpleadosClient } from "@/components/admin/AdminEmpleadosClient";

export default async function AdminEmpleadosPage() {
  const yo = await getSession();

  const empleados = await prisma.user.findMany({
    where: { rol: "ADMIN" },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
      creadoEn: true,
    },
    orderBy: { creadoEn: "asc" },
  });

  const serialized = empleados.map((e) => ({
    ...e,
    creadoEn: e.creadoEn.toISOString(),
    soyYo: e.id === yo?.id,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cada empleado tiene su propia cuenta para acceder al panel. Nunca compartas contraseñas.
        </p>
      </div>
      <AdminEmpleadosClient empleados={serialized} />
    </div>
  );
}
