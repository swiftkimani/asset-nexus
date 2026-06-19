"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { NavSidebar } from "@/components/nav-sidebar"

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
      <NavSidebar />
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
