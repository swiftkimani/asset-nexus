"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Download, Search } from "lucide-react"
import { toast } from "sonner"
import { statusColor, formatCurrency, formatDate } from "@/lib/utils"
import type { AssetOut } from "@/types"

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetOut[]>([])
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    const res = await fetch(`/api/assets?${params}`)
    setAssets(await res.json())
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetch("/api/assets/categories").then((r) => r.json()).then(setCategories) }, [])

  const createAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch("/api/assets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Asset created")
    setOpen(false)
    load()
  }

  const deactivate = async (id: number) => {
    if (!confirm("Deactivate this asset?")) return
    const res = await fetch(`/api/assets/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Asset deactivated")
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assets</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open("/api/assets/export?fmt=csv")}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Asset</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Asset</DialogTitle></DialogHeader>
              <form onSubmit={createAsset} className="space-y-3">
                <div><Label>Unique ID *</Label><Input name="asset_unique_id" required /></div>
                <div><Label>Asset Name *</Label><Input name="asset_name" required /></div>
                <div><Label>Category</Label>
                  <Select name="category">
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Brand</Label><Input name="brand" /></div>
                  <div><Label>Model</Label><Input name="model" /></div>
                </div>
                <div><Label>Serial Number</Label><Input name="serial_number" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Purchase Date</Label><Input name="purchase_date" type="date" /></div>
                  <div><Label>Purchase Cost</Label><Input name="purchase_cost" type="number" step="0.01" /></div>
                </div>
                <div><Label>Vendor</Label><Input name="vendor" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Warranty Expiry</Label><Input name="warranty_expiry" type="date" /></div>
                  <div><Label>Location</Label><Input name="asset_location" /></div>
                </div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground self-center" />
        <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="Under Repair">Under Repair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">Asset ID</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Category</th>
                <th className="p-3 font-medium">Brand/Model</th>
                <th className="p-3 font-medium">Serial No</th>
                <th className="p-3 font-medium">Cost</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{a.asset_id}</td>
                  <td className="p-3">{a.asset_name}</td>
                  <td className="p-3">{a.category || "-"}</td>
                  <td className="p-3">{[a.brand, a.model].filter(Boolean).join(" ") || "-"}</td>
                  <td className="p-3 font-mono text-xs">{a.serial_number || "-"}</td>
                  <td className="p-3">{formatCurrency(a.purchase_cost)}</td>
                  <td className="p-3"><Badge className={statusColor(a.status)}>{a.status}</Badge></td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivate(a.id)}>Deactivate</Button>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No assets found</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
