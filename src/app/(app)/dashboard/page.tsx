"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Package, ClipboardCheck, Wrench } from "lucide-react"
import type { DashboardStats, RecentAssignment } from "@/types"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentAssignment[]>([])

  useEffect(() => {
    fetch("/api/reports/dashboard").then((r) => r.json()).then(setStats)
    fetch("/api/reports?name=recent-assignments&limit=10").then((r) => r.json()).then(setRecent)
  }, [])

  const cards = [
    { title: "Total Employees", value: stats?.total_employees ?? 0, icon: Users, color: "text-blue-600" },
    { title: "Total Assets", value: stats?.total_assets ?? 0, icon: Package, color: "text-purple-600" },
    { title: "Assigned", value: stats?.assigned_assets ?? 0, icon: ClipboardCheck, color: "text-orange-600" },
    { title: "Available", value: stats?.available_assets ?? 0, icon: Package, color: "text-green-600" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Assignments</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
