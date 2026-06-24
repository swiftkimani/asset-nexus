"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Pagination } from "@/components/ui/pagination"
import { Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency, statusColor } from "@/lib/utils"
import type { PurchaseOrder } from "@/types"
import { useAuth } from "@/components/auth-provider"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"

export default function PurchaseOrdersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
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
    const res = await fetch(`/api/purchase-orders?${params}`)
    const json = await res.json()
    setOrders(json.data)
    setTotal(json.total)
    setLoading(false)
  }, [search, page])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(1) }, [search])

  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: Record<string, any> = Object.fromEntries(form)
    body.total_amount = body.total_amount ? Number(body.total_amount) : null
    const res = await fetch("/api/purchase-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Purchase order created")
    setOpen(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold">Purchase Orders</h1>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New PO</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div><Label>PO Number</Label><Input name="po_number" placeholder="Auto-generated if blank" /></div>
                <div><Label>Vendor *</Label><Input name="vendor" required /></div>
                <div><Label>Order Date</Label><Input name="order_date" type="date" defaultValue={new Date().toISOString().split("T")[0]} /></div>
                <div><Label>Total Amount</Label><Input name="total_amount" type="number" step="0.01" /></div>
                <div><Label>Status</Label>
                  <select name="status" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="Open">Open</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Approved">Approved</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div><Label>Approved By</Label><Input name="approved_by" /></div>
                <div><Label>Notes</Label><Input name="notes" /></div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search POs..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">PO#</th>
                <th className="p-3 font-medium">Vendor</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Amount</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><TableSkeleton rows={5} cols={6} /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={6} className="p-6"><EmptyState title="No purchase orders" description="No purchase orders found." /></td></tr>
              ) : orders.map((po) => (
                <tr key={po.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{po.po_number}</td>
                  <td className="p-3">{po.vendor}</td>
                  <td className="p-3">{po.order_date}</td>
                  <td className="p-3">{formatCurrency(po.total_amount)}</td>
                  <td className="p-3"><Badge className={statusColor(po.status)}>{po.status}</Badge></td>
                  <td className="p-3">
                    {isAdmin ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-destructive">Delete</Button>
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
    </div>
  )
}
