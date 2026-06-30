import { PrismaClient, Rol } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Definí SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en .env antes de correr el seed."
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      nombre: "Administrador",
      email: adminEmail,
      passwordHash,
      rol: Rol.ADMIN,
    },
  });

  console.log(`Seed completado. Admin creado: ${adminEmail}`);

  const vehiculo = await prisma.vehiculo.upsert({
    where: { patente: "AB123CD" },
    update: {},
    create: {
      patente: "AB123CD",
      descripcion: "Micro Mercedes Benz - Servicio Diferencial",
      capacidad: 40,
    },
  });

  console.log("Vehículo de prueba creado:", vehiculo.patente);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
