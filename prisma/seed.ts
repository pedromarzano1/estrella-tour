import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin por defecto
  const passwordHash = await bcrypt.hash("Admin1234!", 12);
  await prisma.user.upsert({
    where: { email: "admin@estrellatour.com.ar" },
    update: {},
    create: {
      nombre: "Administrador",
      email: "admin@estrellatour.com.ar",
      passwordHash,
      rol: Rol.ADMIN,
    },
  });

  // Vehículo de ejemplo
  const vehiculo = await prisma.vehiculo.upsert({
    where: { patente: "AB123CD" },
    update: {},
    create: {
      patente: "AB123CD",
      descripcion: "Micro Mercedes Benz - Servicio Diferencial",
      capacidad: 40,
    },
  });

  console.log("Seed completado. Admin: admin@estrellatour.com.ar / Admin1234!");
  console.log("Vehículo de prueba creado:", vehiculo.patente);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
