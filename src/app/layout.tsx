import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Asset Tracker",
  description: "Company Asset Management System",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground font-sans">
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
