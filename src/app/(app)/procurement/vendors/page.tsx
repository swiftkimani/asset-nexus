"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"
import type { Vendor } from "@/types"
import { useAuth } from "@/components/auth-provider"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"

export default function VendorsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const perPage = 25

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    params.set("skip", String((page - 1) * perPage))
    params.set("limit", String(perPage))
    const res = await fetch(`/api/vendors?${params}`)
    const json = await res.json()
    setVendors(json.data)
    setTotal(json.total)
    setLoading(false)
  }, [search, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search])

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: Record<string, any> = Object.fromEntries(form)
    body.rating = body.rating ? Number(body.rating) : null
    const res = await fetch("/api/vendors", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Vendor created")
    setOpen(false)
    load()
  }

  const update = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editing) return
    const form = new FormData(e.currentTarget)
    const body: Record<string, any> = Object.fromEntries(form)
    body.rating = body.rating ? Number(body.rating) : null
    const res = await fetch(`/api/vendors/${editing.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Vendor updated")
    setEditOpen(false)
    setEditing(null)
    load()
  }

  const deactivate = async (id: number) => {
    if (!confirm("Deactivate this vendor?")) return
    const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Vendor deactivated")
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold">Vendors</h1>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Add Vendor</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div><Label>Name *</Label><Input name="name" required /></div>
                <div><Label>Contact Person</Label><Input name="contact_person" /></div>
                <div><Label>Email</Label><Input name="email" type="email" /></div>
                <div><Label>Phone</Label><Input name="phone" /></div>
                <div><Label>Address</Label><Input name="address" /></div>
                <div><Label>Rating (1-5)</Label>
                  <select name="rating" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div><Label>Notes</Label><Input name="notes" /></div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Phone</th>
                <th className="p-3 font-medium">Rating</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><TableSkeleton rows={5} cols={6} /></td></tr>
              ) : vendors.length === 0 ? (
                <tr><td colSpan={6} className="p-6"><EmptyState title="No vendors" description="No vendors found." /></td></tr>
              ) : vendors.map((v) => (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-medium">{v.name}</td>
                  <td className="p-3">{v.contact_person || "-"}</td>
                  <td className="p-3">{v.email || "-"}</td>
                  <td className="p-3">{v.phone || "-"}</td>
                  <td className="p-3">{v.rating ? "★".repeat(v.rating) + "☆".repeat(5 - v.rating) : "-"}</td>
                  <td className="p-3">
                    {isAdmin ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(v); setEditOpen(true) }}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivate(v.id)}>Deactivate</Button>
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

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Vendor</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={update} className="space-y-3">
              <div><Label>Name *</Label><Input name="name" defaultValue={editing.name} required /></div>
              <div><Label>Contact Person</Label><Input name="contact_person" defaultValue={editing.contact_person ?? ""} /></div>
              <div><Label>Email</Label><Input name="email" type="email" defaultValue={editing.email ?? ""} /></div>
              <div><Label>Phone</Label><Input name="phone" defaultValue={editing.phone ?? ""} /></div>
              <div><Label>Address</Label><Input name="address" defaultValue={editing.address ?? ""} /></div>
              <div><Label>Rating (1-5)</Label>
                <select name="rating" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" defaultValue={editing.rating ?? 3}>
                  {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><Label>Notes</Label><Input name="notes" defaultValue={editing.notes ?? ""} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
