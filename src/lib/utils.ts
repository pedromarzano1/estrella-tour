import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInHours } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function puedeCancel(horarioSalida: Date): boolean {
  return differenceInHours(horarioSalida, new Date()) >= 24;
}

export function formatearPrecio(precio: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(precio);
}

export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(fecha);
}

export function formatearHora(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
}

export const WA_NUMBERS = [
  { numero: "542324504000", label: "2324-504000" },
  { numero: "542324560139", label: "2324-560139" },
  { numero: "541122663000", label: "11-22663000" },
];

export function getWALink(numero: string, mensaje?: string): string {
  const base = `https://wa.me/${numero}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}
