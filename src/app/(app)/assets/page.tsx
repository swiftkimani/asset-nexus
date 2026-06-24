"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { Plus, Download, Search, Save, BookMarked } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { statusColor, formatCurrency } from "@/lib/utils"
import type { AssetOut, SavedFilter } from "@/types"
import { Pagination } from "@/components/ui/pagination"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useAuth } from "@/components/auth-provider"

export default function AssetsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [assets, setAssets] = useState<AssetOut[]>([])
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<AssetOut | null>(null)
  const [repairOpen, setRepairOpen] = useState(false)
  const [repairTarget, setRepairTarget] = useState<AssetOut | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const perPage = 25
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkLocation, setBulkLocation] = useState("")

  const [saveFilterOpen, setSaveFilterOpen] = useState(false)
  const [filterName, setFilterName] = useState("")
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [loadFilterOpen, setLoadFilterOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (statusFilter) params.set("status", statusFilter)
    params.set("skip", String((page - 1) * perPage))
    params.set("limit", String(perPage))
    const res = await fetch(`/api/assets?${params}`)
    const json = await res.json()
    setAssets(json.data)
    setTotal(json.total)
    setLoading(false)
  }, [search, statusFilter, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetch("/api/assets/categories").then((r) => r.json()).then(setCategories) }, [])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  const loadSavedFilters = useCallback(async () => {
    const res = await fetch("/api/filters?entity=assets")
    if (res.ok) setSavedFilters(await res.json())
  }, [])

  useEffect(() => { loadSavedFilters() }, [loadSavedFilters])

  const saveFilter = async () => {
    if (!filterName.trim()) { toast.error("Filter name is required"); return }
    const filters = JSON.stringify({ search, status: statusFilter })
    const res = await fetch("/api/filters", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "assets", name: filterName, filters }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Filter saved")
    setSaveFilterOpen(false)
    setFilterName("")
    loadSavedFilters()
  }

  const applyFilter = (f: SavedFilter) => {
    try {
      const parsed = JSON.parse(f.filters)
      setSearch(parsed.search || "")
      setStatusFilter(parsed.status || "")
      setLoadFilterOpen(false)
      toast.success(`Loaded filter: ${f.name}`)
    } catch {
      toast.error("Failed to parse filter")
    }
  }

  const deleteSavedFilter = async (id: number) => {
    const res = await fetch(`/api/filters/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Filter deleted")
    loadSavedFilters()
  }

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

  const updateAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editing) return
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch(`/api/assets/${editing.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Asset updated")
    setEditOpen(false)
    setEditing(null)
    load()
  }

  const markUnderRepair = async () => {
    if (!repairTarget) return
    const res = await fetch(`/api/assets/${repairTarget.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Under Repair" }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success(`${repairTarget.asset_name} marked as Under Repair`)
    setRepairOpen(false)
    setRepairTarget(null)
    load()
  }

  const runBulkAction = async (action: string, value?: string) => {
    setBulkLoading(true)
    const res = await fetch("/api/assets/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids: selectedIds, value }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); setBulkLoading(false); return }
    const data = await res.json()
    toast.success(`Bulk ${action}: ${data.affected} asset(s) updated`)
    setSelectedIds([])
    setBulkLocation("")
    setBulkLoading(false)
    load()
  }

  const allSelected = assets.length > 0 && assets.every((a) => selectedIds.includes(a.id))

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(selectedIds.filter((id) => !assets.some((a) => a.id === id)))
    } else {
      const newIds = new Set([...selectedIds, ...assets.map((a) => a.id)])
      setSelectedIds(Array.from(newIds))
    }
  }

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold">Assets</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => window.open("/api/assets/export?fmt=csv")}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          {isAdmin && (
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
          </Dialog>)}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="Under Repair">Under Repair</SelectItem>
          </SelectContent>
        </Select>
        <Dialog open={saveFilterOpen} onOpenChange={setSaveFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="Save current filter"><Save className="h-4 w-4" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Save Current Filter</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Filter Name</Label><Input value={filterName} onChange={(e) => setFilterName(e.target.value)} placeholder="e.g. Laptops in stock" /></div>
              <div className="text-xs text-muted-foreground">
                Current search: &ldquo;{search || "(empty)"}&rdquo;, status: &ldquo;{statusFilter || "All"}&rdquo;
              </div>
              <Button onClick={saveFilter} className="w-full">Save Filter</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={loadFilterOpen} onOpenChange={setLoadFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="Load saved filter"><BookMarked className="h-4 w-4" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Load Saved Filter</DialogTitle></DialogHeader>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {savedFilters.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                  <button className="text-sm text-left flex-1" onClick={() => applyFilter(f)}>
                    <span className="font-medium">{f.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{f.created_at?.slice(0, 10)}</span>
                  </button>
                  <Button variant="ghost" size="sm" className="text-destructive h-7" onClick={() => deleteSavedFilter(f.id)}>Delete</Button>
                </div>
              ))}
              {savedFilters.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No saved filters yet</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                </th>
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
              {loading ? (
                <tr><td colSpan={9}><TableSkeleton rows={5} cols={9} /></td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={9} className="p-6"><EmptyState title="No assets found" description="No assets match your current filters. Try adjusting your search." /></td></tr>
              ) : assets.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 w-10">
                    <Checkbox checked={selectedIds.includes(a.id)} onCheckedChange={() => toggleOne(a.id)} aria-label={`Select ${a.asset_name}`} />
                  </td>
                  <td className="p-3 font-mono text-xs"><Link href={`/assets/${a.id}`} className="hover:underline text-primary">{a.asset_id}</Link></td>
                  <td className="p-3">{a.asset_name}</td>
                  <td className="p-3">{a.category || "-"}</td>
                  <td className="p-3">{[a.brand, a.model].filter(Boolean).join(" ") || "-"}</td>
                  <td className="p-3 font-mono text-xs">{a.serial_number || "-"}</td>
                  <td className="p-3">{formatCurrency(a.purchase_cost)}</td>
                  <td className="p-3"><Badge className={statusColor(a.status)}>{a.status}</Badge></td>
                  <td className="p-3">
                    {isAdmin ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(a); setEditOpen(true) }}>Edit</Button>
                        {a.status !== "Under Repair" && a.status !== "Assigned" && (
                          <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => { setRepairTarget(a); setRepairOpen(true) }}>Under Repair</Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivate(a.id)}>Deactivate</Button>
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

      {selectedIds.length > 0 && (
        <div className="fixed bottom-16 lg:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border shadow-lg rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Button size="sm" variant="outline" className="text-amber-600" onClick={() => runBulkAction("mark_repair")} disabled={bulkLoading}>Mark Repair</Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => runBulkAction("deactivate")} disabled={bulkLoading}>Deactivate</Button>
          <div className="flex items-center gap-2">
            <Input className="w-32 h-8 text-xs" placeholder="Location..." value={bulkLocation} onChange={(e) => setBulkLocation(e.target.value)} />
            <Button size="sm" variant="outline" onClick={() => runBulkAction("update_location", bulkLocation)} disabled={bulkLoading || !bulkLocation.trim()}>Update Location</Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => window.open(`/api/assets/qr-sheet?ids=${selectedIds.join(",")}`)}>Print Labels</Button>
        </div>
      )}

      <Pagination page={page} totalPages={Math.ceil(total / perPage)} onPageChange={setPage} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Asset</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={updateAsset} className="space-y-3">
              <div><Label>Unique ID *</Label><Input name="asset_unique_id" defaultValue={editing.asset_unique_id} required /></div>
              <div><Label>Asset Name *</Label><Input name="asset_name" defaultValue={editing.asset_name} required /></div>
              <div><Label>Category</Label>
                <Select name="category" defaultValue={editing.category ?? ""}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Brand</Label><Input name="brand" defaultValue={editing.brand ?? ""} /></div>
                <div><Label>Model</Label><Input name="model" defaultValue={editing.model ?? ""} /></div>
              </div>
              <div><Label>Serial Number</Label><Input name="serial_number" defaultValue={editing.serial_number ?? ""} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Purchase Date</Label><Input name="purchase_date" type="date" defaultValue={editing.purchase_date ?? ""} /></div>
                <div><Label>Purchase Cost</Label><Input name="purchase_cost" type="number" step="0.01" defaultValue={editing.purchase_cost ?? ""} /></div>
              </div>
              <div><Label>Vendor</Label><Input name="vendor" defaultValue={editing.vendor ?? ""} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Warranty Expiry</Label><Input name="warranty_expiry" type="date" defaultValue={editing.warranty_expiry ?? ""} /></div>
                <div><Label>Location</Label><Input name="asset_location" defaultValue={editing.asset_location ?? ""} /></div>
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={repairOpen} onOpenChange={setRepairOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Mark Asset as Under Repair</DialogTitle></DialogHeader>
          {repairTarget && (
            <div className="space-y-4">
              <p className="text-sm">
                Mark <strong>{repairTarget.asset_name}</strong> ({repairTarget.asset_id}) as Under Repair?
              </p>
              <p className="text-xs text-muted-foreground">Status will change to "Under Repair". Update it back to "Available" when repairs are complete.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setRepairOpen(false)}>Cancel</Button>
                <Button className="bg-amber-600 hover:bg-amber-700" onClick={markUnderRepair}>Confirm</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
