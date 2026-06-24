"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { statusColor, formatDate } from "@/lib/utils"
import type { AssignmentOut, AssetOut, Employee } from "@/types"
import { Pagination } from "@/components/ui/pagination"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useAuth } from "@/components/auth-provider"

export default function AssignmentsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [assignments, setAssignments] = useState<AssignmentOut[]>([])
  const [assets, setAssets] = useState<AssetOut[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [statusFilter, setStatusFilter] = useState("")
  const [open, setOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [returning, setReturning] = useState<AssignmentOut | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTarget, setTransferTarget] = useState<AssignmentOut | null>(null)
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [assignmentPage, setAssignmentPage] = useState(1)
  const [assignmentTotal, setAssignmentTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const perPage = 25

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set("status", statusFilter)
    params.set("skip", String((assignmentPage - 1) * perPage))
    params.set("limit", String(perPage))
    const res = await fetch(`/api/assignments?${params}`)
    const json = await res.json()
    setAssignments(json.data)
    setAssignmentTotal(json.total)
    setLoading(false)
  }, [statusFilter, assignmentPage])

  useEffect(() => { load() }, [load])
  useEffect(() => { setAssignmentPage(1) }, [statusFilter])

  useEffect(() => {
    fetch("/api/assets?status=Available&limit=200").then(async (r) => {
      const json = await r.json()
      setAssets(json.data ?? json)
    })
  }, [])
  useEffect(() => {
    fetch("/api/employees?limit=200").then(async (r) => {
      const json = await r.json()
      setAllEmployees(json.data ?? json)
      setEmployees(json.data ?? json)
    })
  }, [])

  const assign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch("/api/assignments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, asset_id: Number(body.asset_id), employee_id: Number(body.employee_id) }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Asset assigned")
    setOpen(false)
    load()
    fetch("/api/assets?status=Available&limit=200").then(async (r) => {
      const json = await r.json()
      setAssets(json.data ?? json)
    })
  }

  const returnAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!returning) return
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch(`/api/assignments/${returning.id}/return`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Asset returned")
    setReturnOpen(false)
    setReturning(null)
    load()
    fetch("/api/assets?status=Available&limit=200").then(async (r) => {
      const json = await r.json()
      setAssets(json.data ?? json)
    })
  }

  const transfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!transferTarget) return
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch(`/api/assignments/${transferTarget.id}/transfer`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, new_employee_id: Number(body.new_employee_id) }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Asset transferred")
    setTransferOpen(false)
    setTransferTarget(null)
    load()
    fetch("/api/assets?status=Available&limit=200").then(async (r) => {
      const json = await r.json()
      setAssets(json.data ?? json)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold">Assignments</h1>
        {isAdmin && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Assign Asset</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Asset</DialogTitle></DialogHeader>
            <form onSubmit={assign} className="space-y-4">
              <div><Label>Asset</Label>
                <Select name="asset_id" required>
                  <SelectTrigger><SelectValue placeholder="Select asset" /></SelectTrigger>
                  <SelectContent>
                    {assets.filter((a) => a.status === "Available").map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>{a.asset_name} ({a.asset_unique_id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Employee</Label>
                <Select name="employee_id" required>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.employee_id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Assigned Date</Label><Input name="assigned_date" type="date" required /></div>
              <div><Label>Notes</Label><Input name="notes" /></div>
              <Button type="submit" className="w-full">Assign</Button>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="Returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">ID</th>
                <th className="p-3 font-medium">Asset</th>
                <th className="p-3 font-medium">Employee</th>
                <th className="p-3 font-medium">Assigned</th>
                <th className="p-3 font-medium">Returned</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><TableSkeleton rows={5} cols={7} /></td></tr>
              ) : assignments.length === 0 ? (
                <tr><td colSpan={7} className="p-6"><EmptyState title="No assignments found" description="No assignments match your current filters." /></td></tr>
              ) : assignments.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-mono text-xs">{a.assignment_id}</td>
                  <td className="p-3">{a.asset_name}</td>
                  <td className="p-3">{a.employee_name}</td>
                  <td className="p-3">{formatDate(a.assigned_date)}</td>
                  <td className="p-3">{formatDate(a.returned_date)}</td>
                  <td className="p-3"><Badge className={statusColor(a.assignment_status)}>{a.assignment_status}</Badge></td>
                  <td className="p-3">
                    {a.assignment_status === "Assigned" && isAdmin && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setTransferTarget(a); setTransferOpen(true) }}>
                          Transfer
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setReturning(a); setReturnOpen(true) }}>
                          Return
                        </Button>
                      </div>
                    )}
                    {a.assignment_status === "Assigned" && !isAdmin && (
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

      <Pagination page={assignmentPage} totalPages={Math.ceil(assignmentTotal / perPage)} onPageChange={setAssignmentPage} />

      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Return Asset</DialogTitle></DialogHeader>
          {returning && (
            <form onSubmit={returnAsset} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Returning: <strong>{returning.asset_name}</strong> from <strong>{returning.employee_name}</strong>
              </p>
              <div><Label>Return Date</Label><Input name="returned_date" type="date" required /></div>
              <div><Label>Notes</Label><Input name="notes" /></div>
              <Button type="submit" className="w-full">Confirm Return</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transfer Asset</DialogTitle></DialogHeader>
          {transferTarget && (
            <form onSubmit={transfer} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Transferring: <strong>{transferTarget.asset_name}</strong> from <strong>{transferTarget.employee_name}</strong>
              </p>
              <div><Label>New Employee *</Label>
                <Select name="new_employee_id" required>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {allEmployees.filter((e) => e.id !== transferTarget.employee_id).map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>{e.name} ({e.employee_id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Assigned Date</Label><Input name="assigned_date" type="date" /></div>
              <div><Label>Notes</Label><Input name="notes" /></div>
              <Button type="submit" className="w-full">Confirm Transfer</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
