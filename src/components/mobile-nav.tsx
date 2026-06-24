"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "./auth-provider"
import { useTheme } from "./theme-provider"
import {
  LayoutDashboard, Users, Package, ClipboardList, FilePlus, FileText, LogOut, Moon, Sun, ScanLine,
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

export function MobileNav() {
  const pathname = usePathname()
  const { logout } = useAuth()
  const { theme, toggle } = useTheme()

  if (pathname === "/") return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex lg:hidden">
      <div className="flex flex-1 items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium transition-colors min-w-0 ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate w-full text-center leading-tight">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={toggle}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors min-w-0"
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="truncate w-full text-center leading-tight">{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
        <button
          onClick={logout}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors min-w-0"
        >
          <LogOut className="h-5 w-5" />
          <span className="truncate w-full text-center leading-tight">Logout</span>
        </button>
      </div>
    </nav>
  )
}
