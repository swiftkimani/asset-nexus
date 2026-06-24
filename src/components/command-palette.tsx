"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, LayoutDashboard, Users, Package, ClipboardList, FileText, Settings } from "lucide-react"
import { useKeyboardShortcuts } from "./keyboard-shortcuts"

interface NavItem {
  href: string
  label: string
  icon: typeof Search
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/assets", label: "Assets", icon: Package },
  { href: "/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleOpen = useCallback(() => setOpen(true), [])
  useKeyboardShortcuts(handleOpen)

  const filtered = query
    ? navItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : navItems

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery("")
    }
  }, [open])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md top-[15%] -translate-y-0">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              className="pl-9"
              placeholder="Search pages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length > 0) {
                  handleSelect(filtered[0].href)
                }
              }}
            />
          </div>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {filtered.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                  onClick={() => handleSelect(item.href)}
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {item.label}
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No results</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
