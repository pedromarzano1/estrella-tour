import { z } from "zod";

export const registroSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  email: z.string().email("Email inválido"),
  telefono: z.string().optional(),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
    .regex(/[0-9]/, "Debe tener al menos un número"),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export const crearViajeSchema = z.object({
  origen: z.string().min(2).max(100),
  destino: z.string().min(2).max(100),
  horarioSalida: z.string().datetime({ offset: true }).or(z.string().refine((v) => !isNaN(Date.parse(v)))),
  precio: z.number().positive("El precio debe ser mayor a 0"),
  vehiculoId: z.string().min(1, "Seleccioná un vehículo"),
  observaciones: z.string().max(500).optional(),
});

export const crearVehiculo = z.object({
  patente: z.string().min(6).max(10).toUpperCase(),
  descripcion: z.string().min(2).max(200),
  capacidad: z.number().int().min(1).max(100),
});

export const crearReservaSchema = z.object({
  viajeId: z.string().min(1),
  asientoId: z.string().min(1),
  metodoPago: z.enum(["MERCADO_PAGO", "EFECTIVO"]),
});

export const actualizarPerfilSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  telefono: z.string().max(20).optional().or(z.literal("")),
});

export const cambiarPasswordSchema = z.object({
  passwordActual: z.string().min(1, "Ingresá tu contraseña actual"),
  passwordNueva: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe tener al menos una mayúscula")
    .regex(/[0-9]/, "Debe tener al menos un número"),
});

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CrearViajeInput = z.infer<typeof crearViajeSchema>;
export type CrearReservaInput = z.infer<typeof crearReservaSchema>;
