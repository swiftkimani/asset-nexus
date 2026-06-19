"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard, Users, Package, ClipboardList, FileText, LogOut,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: FileText },
]

export function NavSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (pathname === "/") return null

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-lg font-bold">Asset Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">{user?.name}</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <Button variant={active ? "secondary" : "ghost"} className="w-full justify-start gap-3">
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}
