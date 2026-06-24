"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"

interface NotificationItem {
  id: number
  title: string
  message: string
  type: string
  link: string | null
  is_read: number
  created_at: string
}

function timeAgo(dateStr: string) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function NotificationBell() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchUnread = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch("/api/notifications/unread-count")
      if (res.ok) {
        const data = await res.json()
        setUnread(data.count)
      }
    } catch {}
  }, [user])

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) setNotifications(await res.json())
    } catch {}
  }, [user])

  useEffect(() => {
    fetchUnread()
    intervalRef.current = setInterval(fetchUnread, 30000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [fetchUnread])

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open, fetchNotifications])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "POST" })
    setUnread(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })))
  }

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div className={`px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${n.is_read ? "" : "bg-muted/30"}`}>
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                )
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
