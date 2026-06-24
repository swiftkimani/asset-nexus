"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { NavSidebar } from "@/components/nav-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { CommandPalette } from "@/components/command-palette"
import { NotificationBell } from "@/components/notification-bell"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const initialized = useRef(false)

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/")
      return
    }
    if (!initialized.current) {
      initialized.current = true
      fetch("/api/init", { method: "POST" }).catch(() => {})
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen flex">
      <CommandPalette />
      <NavSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-end px-4 lg:px-8 shrink-0">
          <NotificationBell />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-auto pb-20 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}
