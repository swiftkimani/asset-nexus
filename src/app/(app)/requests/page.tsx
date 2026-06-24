"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Plus, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Pagination } from "@/components/ui/pagination"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useAuth } from "@/components/auth-provider"
import type { AssetRequest } from "@/types"

const statusBadge = (status: string) => {
  switch (status) {
    case "Pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "Approved": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "Rejected": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default: return ""
  }
}

export default function RequestsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [requests, setRequests] = useState<AssetRequest[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(isAdmin ? "all" : "mine")
  const perPage = 25

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("status", search)
    if (statusFilter) params.set("status", statusFilter)
    if (tab === "mine") params.set("status", statusFilter || undefined!)
    params.set("skip", String((page - 1) * perPage))
    params.set("limit", String(perPage))
    const url = `/api/requests?${params}`
    const res = await fetch(url)
    if (!res.ok) return
    const json = await res.json()
    setRequests(json.data)
    setTotal(json.total)
    setLoading(false)
  }, [search, statusFilter, page, tab])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search, statusFilter, tab])

  const createRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: Record<string, string> = {}
    form.forEach((v, k) => { body[k] = v as string })
    body.requester_email = user?.email || ""
    body.requester_name = user?.name || ""
    const res = await fetch("/api/requests", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Request submitted")
    setOpen(false)
    load()
  }

  const updateStatus = async (id: number, status: string) => {
    const notes = prompt(`Enter review notes for ${status.toLowerCase()} request:`)
    const res = await fetch(`/api/requests/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, review_notes: notes || "" }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success(`Request ${status.toLowerCase()}`)
    load()
  }

  const filtered = requests.filter((r) => {
    if (tab === "mine" && r.requester_email !== user?.email) return false
    if (statusFilter && r.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return r.asset_name.toLowerCase().includes(q) || r.requester_name.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold">Asset Requests</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Asset Request</DialogTitle></DialogHeader>
            <form onSubmit={createRequest} className="space-y-3">
              <div><Label>Asset Name *</Label><Input name="asset_name" required placeholder="e.g. MacBook Pro 16&quot;" /></div>
              <div><Label>Category</Label>
                <Input name="category" placeholder="e.g. Laptop, Monitor, Software" />
              </div>
              <div><Label>Justification</Label>
                <Input name="justification" placeholder="Why do you need this asset?" />
              </div>
              <Button type="submit" className="w-full">Submit Request</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="mine">My Requests</TabsTrigger>
          {isAdmin && <TabsTrigger value="all">All Requests</TabsTrigger>}
        </TabsList>

        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by asset or requester..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select
            className="flex h-10 w-full sm:w-36 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <TabsContent value={tab} className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-medium">Requester</th>
                    <th className="p-3 font-medium">Asset</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Date</th>
                    {(tab === "all" || isAdmin) && <th className="p-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6}><TableSkeleton rows={5} cols={6} /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="p-6"><EmptyState title="No requests found" description="No asset requests match your current filters." /></td></tr>
                  ) : filtered.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{r.requester_name}</div>
                        <div className="text-xs text-muted-foreground">{r.requester_email}</div>
                      </td>
                      <td className="p-3 font-medium">{r.asset_name}</td>
                      <td className="p-3">{r.category || "-"}</td>
                      <td className="p-3"><Badge className={statusBadge(r.status)}>{r.status}</Badge></td>
                      <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        {isAdmin && r.status === "Pending" ? (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="text-green-600" onClick={() => updateStatus(r.id, "Approved")}>
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => updateStatus(r.id, "Rejected")}>
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>

          <Pagination page={page} totalPages={Math.ceil(total / perPage)} onPageChange={setPage} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
