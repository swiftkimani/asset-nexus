"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Package, ClipboardCheck, FileText, Activity, Plus, CheckCircle, XCircle, CalendarClock, ShieldAlert, FilePlus } from "lucide-react"
import type { DashboardStats, RecentAssignment, MaintenanceSchedule, AssetOut, AssetRequest } from "@/types"

const CHART_COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

function HorizontalBarChart({ data, labelKey }: { data: { name: string; count: number }[]; labelKey?: string }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="text-xs w-24 truncate">{item.name}</span>
          <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          <span className="text-xs font-mono w-8 text-right">{item.count}</span>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No data</p>}
    </div>
  )
}

function DonutChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <p className="text-sm text-muted-foreground text-center py-4">No data</p>

  const circumference = 2 * Math.PI * 36
  let cumulative = 0

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <svg width="160" height="160" viewBox="0 0 100 100" className="shrink-0">
        <circle cx="50" cy="50" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
        {data.map((d) => {
          const percent = d.count / total
          const seg = circumference * percent
          const offset = cumulative * circumference
          cumulative += percent
          return (
            <circle
              key={d.status}
              cx="50" cy="50" r="36"
              fill="none"
              stroke={CHART_COLORS[data.indexOf(d) % CHART_COLORS.length]}
              strokeWidth="14"
              strokeDasharray={`${seg} ${circumference - seg}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-300"
            />
          )
        })}
      </svg>
      <div className="space-y-1 text-xs">
        {data.map((d, i) => (
          <div key={d.status} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="w-20 truncate">{d.status}</span>
            <span className="font-mono">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChartMonth({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-xs font-mono">{d.count}</span>
          <div
            className="w-full bg-primary rounded-t transition-all"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
          <span className="text-[10px] text-muted-foreground truncate w-full text-center">
            {d.month?.slice(-2)}/{d.month?.slice(2, 4)}
          </span>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 w-full">No data</p>}
    </div>
  )
}

interface AuditLogEntry {
  id: number
  user_id: number | null
  user_name: string | null
  action: string
  entity: string
  entity_id: string | null
  details: string | null
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

function ActivityIcon({ action }: { action: string }) {
  switch (action) {
    case "create": return <Plus className="h-3.5 w-3.5 text-green-500" />
    case "approve": return <CheckCircle className="h-3.5 w-3.5 text-green-500" />
    case "reject": return <XCircle className="h-3.5 w-3.5 text-red-500" />
    case "update": return <FileText className="h-3.5 w-3.5 text-blue-500" />
    default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentAssignment[]>([])
  const [activity, setActivity] = useState<AuditLogEntry[]>([])
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<(MaintenanceSchedule & { asset_name: string; asset_display_id: string })[]>([])
  const [warrantyExpiring, setWarrantyExpiring] = useState<{ id: number; asset_id: string; asset_name: string; warranty_expiry: string }[]>([])
  const [pendingRequests, setPendingRequests] = useState<AssetRequest[]>([])

  useEffect(() => {
    fetch("/api/reports/dashboard").then((r) => r.json()).then(setStats)
    fetch("/api/reports?name=recent-assignments&limit=10").then((r) => r.json()).then(setRecent)
    fetch("/api/maintenance/upcoming?days=30").then((r) => r.ok && r.json()).then(setUpcomingMaintenance).catch(() => {})
    fetch("/api/assets/warranty-expiring?days=30").then((r) => r.ok && r.json()).then(setWarrantyExpiring).catch(() => {})
    fetch("/api/requests?status=Pending&limit=3").then((r) => r.json()).then((d) => setPendingRequests(d.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const fetchActivity = () => fetch("/api/audit-logs?limit=20").then((r) => r.ok && r.json()).then(setActivity).catch(() => {})
    fetchActivity()
    const interval = setInterval(fetchActivity, 30000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    { title: "Total Employees", value: stats?.total_employees ?? 0, icon: Users, color: "text-blue-600" },
    { title: "Total Assets", value: stats?.total_assets ?? 0, icon: Package, color: "text-purple-600" },
    { title: "Assigned", value: stats?.assigned_assets ?? 0, icon: ClipboardCheck, color: "text-orange-600" },
    { title: "Available", value: stats?.available_assets ?? 0, icon: Package, color: "text-green-600" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={stats?.assets_by_category ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Assets by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={stats?.assets_by_status ?? []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Assignments per Month</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChartMonth data={stats?.assignments_by_month ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Asset</th>
                <th className="pb-2 font-medium">Employee</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2">{r.asset_name} <span className="text-muted-foreground">({r.asset_unique_id})</span></td>
                  <td className="py-2">{r.employee_name}</td>
                  <td className="py-2">{r.assigned_date}</td>
                  <td className="py-2">{r.status}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No recent assignments</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-80 overflow-y-auto p-0">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>
          ) : (
            <div className="space-y-0">
              {activity.map((entry, i) => (
                <div key={entry.id} className="flex items-start gap-3 px-4 py-2.5 border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="mt-0.5 shrink-0">
                    <ActivityIcon action={entry.action} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-tight">
                      <span className="font-medium">{entry.user_name || "System"}</span>
                      {" "}{entry.action}d{" "}
                      <span className="font-medium">{entry.entity}</span>
                      {entry.details && <span className="text-muted-foreground"> — {entry.details}</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(entry.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-orange-500" /> Upcoming Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingMaintenance.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No upcoming maintenance</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-2 font-medium">Asset</th>
                    <th className="px-3 py-2 font-medium">Schedule</th>
                    <th className="px-3 py-2 font-medium">Due</th>
                    <th className="px-3 py-2 font-medium">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingMaintenance.slice(0, 5).map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <Link href={`/assets/${m.asset_id}`} className="hover:underline text-primary font-medium">{m.asset_name}</Link>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{m.schedule_name}</td>
                      <td className="px-3 py-2">{new Date(m.next_due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="px-3 py-2">{m.assigned_to || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-500" /> Warranty Expiring
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {warrantyExpiring.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No warranties expiring</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-2 font-medium">Asset</th>
                    <th className="px-3 py-2 font-medium">Expiry</th>
                    <th className="px-3 py-2 font-medium">Days Left</th>
                  </tr>
                </thead>
                <tbody>
                  {warrantyExpiring.slice(0, 5).map((a) => {
                    const daysLeft = Math.ceil((new Date(a.warranty_expiry).getTime() - Date.now()) / 86400000)
                    return (
                      <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-2">
                          <Link href={`/assets/${a.id}`} className="hover:underline text-primary font-medium">{a.asset_name}</Link>
                        </td>
                        <td className="px-3 py-2">{new Date(a.warranty_expiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="px-3 py-2">
                          <Badge className={daysLeft <= 7 ? "bg-red-100 text-red-800" : daysLeft <= 30 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                            {daysLeft}d
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FilePlus className="h-4 w-4 text-blue-500" /> Pending Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-auto bg-blue-100 text-blue-800">{pendingRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pendingRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No pending requests</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="px-3 py-2 font-medium">Requester</th>
                    <th className="px-3 py-2 font-medium">Asset</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2">{r.requester_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.asset_name}</td>
                      <td className="px-3 py-2">{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
            <div className="p-3 border-t">
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href="/requests">View all requests →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
