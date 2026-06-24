"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { ArrowLeft, Package, UserPlus, Undo2, Wrench, Trash2, Plus, ShieldAlert, ClipboardList, CalendarClock, Recycle, Printer } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatDate, formatCurrency, statusColor, straightLineDepreciation } from "@/lib/utils"
import { toast } from "sonner"
import type { DisposalLog, WarrantyClaim, ServiceLog, MaintenanceSchedule } from "@/types"

interface HistoryEntry {
  date: string
  type: string
  description: string
  user: string
}

export default function AssetDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [asset, setAsset] = useState<Record<string, unknown> | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [disposals, setDisposals] = useState<DisposalLog[]>([])
  const [warranties, setWarranties] = useState<WarrantyClaim[]>([])
  const [services, setServices] = useState<ServiceLog[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceSchedule[]>([])

  const load = () => {
    if (!params.id) return
    setLoading(true)
    fetch(`/api/assets/${params.id}/history`)
      .then((r) => r.json())
      .then((data) => {
        setAsset(data.asset as Record<string, unknown>)
        setHistory(data.history as HistoryEntry[])
        setLoading(false)
      })
      .catch(() => setLoading(false))
    fetch(`/api/assets/${params.id}/warranty`).then((r) => r.json()).then(setWarranties).catch(() => {})
    fetch(`/api/assets/${params.id}/service`).then((r) => r.json()).then(setServices).catch(() => {})
    fetch(`/api/assets/${params.id}/maintenance`).then((r) => r.json()).then(setMaintenance).catch(() => {})
  }

  useEffect(() => { load() }, [params.id])

  const createWarranty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch(`/api/assets/${params.id}/warranty`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Warranty claim filed")
    fetch(`/api/assets/${params.id}/warranty`).then((r) => r.json()).then(setWarranties)
  }

  const createService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch(`/api/assets/${params.id}/service`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, cost: body.cost ? Number(body.cost) : null, downtime_days: body.downtime_days ? Number(body.downtime_days) : null }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Service log created")
    fetch(`/api/assets/${params.id}/service`).then((r) => r.json()).then(setServices)
  }

  const createMaintenance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch(`/api/assets/${params.id}/maintenance`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, frequency_days: Number(body.frequency_days) }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Maintenance schedule created")
    fetch(`/api/assets/${params.id}/maintenance`).then((r) => r.json()).then(setMaintenance)
  }

  const dispose = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch(`/api/assets/${params.id}/dispose`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Asset disposed")
    load()
  }

  const iconForType = (type: string) => {
    const className = "h-4 w-4"
    switch (type) {
      case "create":
        return <div className="absolute -left-[25px] p-1 rounded-full bg-green-100 dark:bg-green-900 border-2 border-background"><Plus className={`${className} text-green-600`} /></div>
      case "update":
        return <div className="absolute -left-[25px] p-1 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-background"><Wrench className={`${className} text-blue-600`} /></div>
      case "deactivate":
        return <div className="absolute -left-[25px] p-1 rounded-full bg-red-100 dark:bg-red-900 border-2 border-background"><Trash2 className={`${className} text-red-600`} /></div>
      case "assigned":
        return <div className="absolute -left-[25px] p-1 rounded-full bg-purple-100 dark:bg-purple-900 border-2 border-background"><UserPlus className={`${className} text-purple-600`} /></div>
      case "returned":
        return <div className="absolute -left-[25px] p-1 rounded-full bg-orange-100 dark:bg-orange-900 border-2 border-background"><Undo2 className={`${className} text-orange-600`} /></div>
      case "disposed":
        return <div className="absolute -left-[25px] p-1 rounded-full bg-red-100 dark:bg-red-900 border-2 border-background"><Recycle className={`${className} text-red-600`} /></div>
      case "serviced":
        return <div className="absolute -left-[25px] p-1 rounded-full bg-yellow-100 dark:bg-yellow-900 border-2 border-background"><Wrench className={`${className} text-yellow-600`} /></div>
      default:
        return <div className="absolute -left-[25px] p-1 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-background"><Package className={`${className} text-muted-foreground`} /></div>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <Card><CardContent className="p-6"><div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-muted rounded animate-pulse w-full" />)}</div></CardContent></Card>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="space-y-6">
        <Link href="/assets" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Back to Assets</Link>
        <p className="text-muted-foreground">Asset not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/assets" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 w-fit">
        <ArrowLeft className="h-4 w-4" /> Back to Assets
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 flex-wrap">
            {String(asset.asset_name ?? "")}
            <Badge className={statusColor(String(asset.status ?? ""))}>{String(asset.status ?? "")}</Badge>
            {isAdmin && (
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => window.open(`/api/assets/${params.id}/qr`)}>
                <Printer className="h-4 w-4 mr-1" /> Print Label
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Asset ID</span><p className="font-mono">{String(asset.asset_id ?? "")}</p></div>
            <div><span className="text-muted-foreground">Unique ID</span><p className="font-mono">{String(asset.asset_unique_id ?? "")}</p></div>
            <div><span className="text-muted-foreground">Category</span><p>{String(asset.category ?? "-")}</p></div>
            <div><span className="text-muted-foreground">Brand / Model</span><p>{[asset.brand, asset.model].filter(Boolean).join(" ") || "-"}</p></div>
            <div><span className="text-muted-foreground">Serial Number</span><p className="font-mono">{String(asset.serial_number ?? "-")}</p></div>
            <div><span className="text-muted-foreground">Cost</span><p>{formatCurrency(asset.purchase_cost as number | string | null | undefined)}</p></div>
            <div><span className="text-muted-foreground">Current Value</span><p>{formatCurrency(straightLineDepreciation(asset.purchase_cost as number | null | undefined, asset.salvage_value as number | null | undefined, asset.useful_life_years as number | null | undefined, asset.purchase_date as string | null | undefined))}</p></div>
            <div><span className="text-muted-foreground">Location</span><p>{String(asset.asset_location ?? "-")}</p></div>
            <div><span className="text-muted-foreground">Condition</span><p>{String(asset.condition ?? "Good")}</p></div>
            <div><span className="text-muted-foreground">Vendor</span><p>{String(asset.vendor ?? "-")}</p></div>
            <div><span className="text-muted-foreground">Purchase Date</span><p>{formatDate(asset.purchase_date as string | null | undefined)}</p></div>
            <div>
              <span className="text-muted-foreground">Warranty Expiry</span>
              <p>
                {formatDate(asset.warranty_expiry as string | null | undefined)}
                {(asset.warranty_expiry as string | null) && new Date(asset.warranty_expiry as string) < new Date() ? (
                  <Badge variant="destructive" className="ml-2 text-[10px]">Expired</Badge>
                ) : null}
              </p>
            </div>
            <div><span className="text-muted-foreground">Total Cost of Ownership</span><p>{(asset.purchase_cost && asset.accumulated_maintenance_cost) ? formatCurrency(Number(asset.purchase_cost) + Number(asset.accumulated_maintenance_cost)) : formatCurrency(asset.purchase_cost as number | string | null | undefined)}</p></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="history">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="history" className="flex-1 sm:flex-none"><Package className="h-4 w-4 mr-2" /> History</TabsTrigger>
          <TabsTrigger value="warranty" className="flex-1 sm:flex-none"><ShieldAlert className="h-4 w-4 mr-2" /> Warranty</TabsTrigger>
          <TabsTrigger value="service" className="flex-1 sm:flex-none"><Wrench className="h-4 w-4 mr-2" /> Service</TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1 sm:flex-none"><CalendarClock className="h-4 w-4 mr-2" /> Maintenance</TabsTrigger>
          {isAdmin && <TabsTrigger value="disposal" className="flex-1 sm:flex-none"><Recycle className="h-4 w-4 mr-2" /> Disposal</TabsTrigger>}
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle>History Timeline</CardTitle></CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history events recorded.</p>
              ) : (
                <div className="relative pl-8 border-l-2 border-muted space-y-6">
                  {history.map((entry, i) => (
                    <div key={i} className="relative">
                      {iconForType(entry.type)}
                      <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      <p className="text-sm font-medium">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">{entry.user}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="warranty" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm">Warranty Claims</CardTitle>
                {isAdmin && (
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> File Claim</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>File Warranty Claim</DialogTitle></DialogHeader>
                      <form onSubmit={createWarranty} className="space-y-3">
                        <div><Label>Claim Number</Label><Input name="claim_number" /></div>
                        <div><Label>RMA Number</Label><Input name="rma_number" /></div>
                        <div><Label>Vendor Contact</Label><Input name="vendor_contact" /></div>
                        <div><Label>Claim Date *</Label><Input name="claim_date" type="date" required /></div>
                        <div><Label>Issue Description</Label><Input name="issue_description" /></div>
                        <Button type="submit" className="w-full">Submit Claim</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="p-3 font-medium">Claim #</th><th className="p-3 font-medium">RMA</th><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Status</th><th className="p-3 font-medium">Issue</th></tr></thead>
                <tbody>
                  {warranties.map((w) => (
                    <tr key={w.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 font-mono text-xs">{w.claim_number || "-"}</td>
                      <td className="p-3 font-mono text-xs">{w.rma_number || "-"}</td>
                      <td className="p-3">{w.claim_date}</td>
                      <td className="p-3"><Badge className={statusColor(w.status)}>{w.status}</Badge></td>
                      <td className="p-3 text-muted-foreground">{w.issue_description || "-"}</td>
                    </tr>
                  ))}
                  {warranties.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No warranty claims</td></tr>}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm">Service / Repair Log</CardTitle>
                {isAdmin && (
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Log Service</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Log Service / Repair</DialogTitle></DialogHeader>
                      <form onSubmit={createService} className="space-y-3">
                        <div><Label>Reported Date *</Label><Input name="reported_date" type="date" required /></div>
                        <div><Label>Issue Description *</Label><Input name="issue_description" required /></div>
                        <div><Label>Vendor</Label><Input name="vendor" /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>Cost</Label><Input name="cost" type="number" step="0.01" /></div>
                          <div><Label>Downtime (days)</Label><Input name="downtime_days" type="number" /></div>
                        </div>
                        <div><Label>Resolution</Label><Input name="resolution" /></div>
                        <div><Label>Resolved Date</Label><Input name="resolved_date" type="date" /></div>
                        <div><Label>Notes</Label><Input name="service_notes" /></div>
                        <Button type="submit" className="w-full">Log Service</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Issue</th><th className="p-3 font-medium">Vendor</th><th className="p-3 font-medium">Cost</th><th className="p-3 font-medium">Resolution</th></tr></thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3">{s.reported_date}</td>
                      <td className="p-3">{s.issue_description}</td>
                      <td className="p-3">{s.vendor || "-"}</td>
                      <td className="p-3">{formatCurrency(s.cost)}</td>
                      <td className="p-3 text-muted-foreground">{s.resolution || "-"}</td>
                    </tr>
                  ))}
                  {services.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No service logs</td></tr>}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm">Maintenance Schedule</CardTitle>
                {isAdmin && (
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Schedule</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Schedule Maintenance</DialogTitle></DialogHeader>
                      <form onSubmit={createMaintenance} className="space-y-3">
                        <div><Label>Schedule Name *</Label><Input name="schedule_name" required /></div>
                        <div><Label>Frequency (days) *</Label><Input name="frequency_days" type="number" required /></div>
                        <div><Label>Next Due Date *</Label><Input name="next_due_date" type="date" required /></div>
                        <div><Label>Assigned To</Label><Input name="assigned_to" /></div>
                        <div><Label>Notes</Label><Input name="notes" /></div>
                        <Button type="submit" className="w-full">Create Schedule</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-left"><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Frequency</th><th className="p-3 font-medium">Last Done</th><th className="p-3 font-medium">Next Due</th><th className="p-3 font-medium">Assigned</th><th className="p-3 font-medium">Status</th></tr></thead>
                <tbody>
                  {maintenance.map((m) => (
                    <tr key={m.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 font-medium">{m.schedule_name}</td>
                      <td className="p-3">Every {m.frequency_days}d</td>
                      <td className="p-3">{formatDate(m.last_done_date)}</td>
                      <td className="p-3">{formatDate(m.next_due_date)}</td>
                      <td className="p-3">{m.assigned_to || "-"}</td>
                      <td className="p-3"><Badge className={m.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{m.is_active ? "Active" : "Inactive"}</Badge></td>
                    </tr>
                  ))}
                  {maintenance.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No maintenance schedules</td></tr>}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="disposal" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm">Disposal / Retirement</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild><Button size="sm" variant="destructive"><Recycle className="h-4 w-4 mr-1" /> Dispose Asset</Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Dispose Asset</DialogTitle></DialogHeader>
                      <form onSubmit={dispose} className="space-y-3">
                        <p className="text-sm text-muted-foreground">This will mark <strong>{String(asset.asset_name)}</strong> as disposed.</p>
                        <div><Label>Disposal Date *</Label><Input name="disposal_date" type="date" required /></div>
                        <div><Label>Method</Label>
                          <select name="disposal_method" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                            <option value="Recycled">Recycled</option>
                            <option value="Sold">Sold</option>
                            <option value="Donated">Donated</option>
                            <option value="Destroyed">Destroyed</option>
                            <option value="Returned to Vendor">Returned to Vendor</option>
                          </select>
                        </div>
                        <div><Label>Authorized By</Label><Input name="authorized_by" /></div>
                        <div><Label>Reason</Label><Input name="reason" /></div>
                        <div><Label>Notes</Label><Input name="notes" /></div>
                        <Button type="submit" className="w-full" variant="destructive">Confirm Disposal</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Method</th><th className="p-3 font-medium">Authorized By</th><th className="p-3 font-medium">Reason</th></tr></thead>
                  <tbody>
                    {disposals.map((d) => (
                      <tr key={d.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-3">{d.disposal_date}</td>
                        <td className="p-3">{d.disposal_method}</td>
                        <td className="p-3">{d.authorized_by || "-"}</td>
                        <td className="p-3 text-muted-foreground">{d.reason || "-"}</td>
                      </tr>
                    ))}
                    {disposals.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No disposal records</td></tr>}
                  </tbody>
                </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
