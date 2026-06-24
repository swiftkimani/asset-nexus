"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { useAuth } from "./auth-provider"
import { useTheme } from "./theme-provider"
import { Button } from "@/components/ui/button"
import { ProfileDialog } from "./profile-dialog"
import {
  LayoutDashboard, Users, Package, ClipboardList, FilePlus, FileText, Settings, LogOut, Moon, Sun, ScanLine,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/scan", label: "Scan", icon: ScanLine },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/requests", label: "Requests", icon: FilePlus },
  { href: "/reports", label: "Reports", icon: FileText },
]

export function NavSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const [profileOpen, setProfileOpen] = useState(false)

  if (pathname === "/") return null

  return (
    <>
      <aside className="w-64 border-r bg-card flex-col hidden lg:flex">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Asset Nexus" className="h-8 w-8" />
            <div className="flex-1">
              <h1 className="text-base font-bold leading-tight">Asset Nexus</h1>
              <button onClick={() => setProfileOpen(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left">
                {user?.name}
              </button>
            </div>
          </div>
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
      <div className="p-4 border-t space-y-1">
        {user?.role === "admin" && (
          <Link href="/settings">
            <Button variant={pathname.startsWith("/settings") ? "secondary" : "ghost"} className="w-full justify-start gap-3">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        )}
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggle}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
      </aside>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  )
}
