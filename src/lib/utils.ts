import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount == null) return "-"
  const num = typeof amount === "string" ? Number.parseFloat(amount) : amount
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num)
}

export function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (["active", "available", "assigned"].includes(s)) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  if (["returned"].includes(s)) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  if (["under repair", "inactive"].includes(s)) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  if (["lost"].includes(s)) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
}
