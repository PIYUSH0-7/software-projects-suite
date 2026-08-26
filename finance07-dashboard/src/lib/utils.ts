import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function getUtilizationColor(utilization: number) {
  if (utilization > 80) return "text-red-500";
  if (utilization > 50) return "text-yellow-500";
  return "text-green-500";
}
