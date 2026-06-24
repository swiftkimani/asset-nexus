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

export function straightLineDepreciation(cost: number | null | undefined, salvage: number | null | undefined, lifeYears: number | null | undefined, purchaseDate: string | null | undefined): number {
  if (!cost || !purchaseDate || !lifeYears) return cost ?? 0
  const sv = salvage ?? 0
  const yearsOwned = (Date.now() - new Date(purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  const annualDepreciation = (cost - sv) / lifeYears
  const accumulated = Math.min(annualDepreciation * yearsOwned, cost - sv)
  return Math.max(cost - accumulated, sv)
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters"
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter"
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter"
  if (!/[0-9]/.test(password)) return "Password must contain at least one digit"
  return null
}

export function validateEmail(email: string): string | null {
  if (!email || typeof email !== "string") return "Email is required"
  if (email.length > 254) return "Email is too long"
  if (/\s/.test(email)) return "Email must not contain spaces"
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email)) return "Invalid email format"
  return null
}

export function validateBodySize(request: Request, maxBytes = 1_048_576): string | null {
  const len = request.headers.get("content-length")
  if (len && Number(len) > maxBytes) return `Request body exceeds ${Math.round(maxBytes / 1024)}KB limit`
  return null
}

export function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (["active", "available", "assigned"].includes(s)) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
  if (["returned"].includes(s)) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  if (["under repair", "inactive"].includes(s)) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
  if (["lost"].includes(s)) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
  return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
}
