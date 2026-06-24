"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Pagination } from "@/components/ui/pagination"
import { Plus, Download, Search, UserPlus, UserX } from "lucide-react"
import { toast } from "sonner"
import { statusColor } from "@/lib/utils"
import type { Employee, AssetOut } from "@/types"
import { useAuth } from "@/components/auth-provider"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { EmptyState } from "@/components/ui/empty-state"

export default function EmployeesPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [onboardOpen, setOnboardOpen] = useState(false)
  const [offboardOpen, setOffboardOpen] = useState(false)
  const [offboarding, setOffboarding] = useState<Employee | null>(null)
  const [availableAssets, setAvailableAssets] = useState<AssetOut[]>([])
  const [selectedAssets, setSelectedAssets] = useState<number[]>([])
  const [employeePage, setEmployeePage] = useState(1)
  const [employeeTotal, setEmployeeTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const perPage = 25

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    params.set("skip", String((employeePage - 1) * perPage))
    params.set("limit", String(perPage))
    const res = await fetch(`/api/employees?${params}`)
    const json = await res.json()
    setEmployees(json.data)
    setEmployeeTotal(json.total)
    setLoading(false)
  }, [search, employeePage])

  const loadAssets = useCallback(async () => {
    const res = await fetch("/api/assets?status=Available&limit=200")
    const json = await res.json()
    setAvailableAssets(json.data ?? json)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { setEmployeePage(1) }, [search])

  const createEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch("/api/employees", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Employee created")
    setOpen(false)
    load()
  }

  const updateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editing) return
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch(`/api/employees/${editing.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Employee updated")
    setEditOpen(false)
    setEditing(null)
    load()
  }

  const deactivate = async (id: number) => {
    if (!confirm("Deactivate this employee?")) return
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Employee deactivated")
    load()
  }

  const onboard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body: Record<string, any> = Object.fromEntries(form)
    body.asset_ids = selectedAssets
    const res = await fetch("/api/employees/onboard", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    const data = await res.json()
    toast.success(`Onboarded ${body.name} — ${data.assigned_assets} assets assigned`)
    setOnboardOpen(false)
    setSelectedAssets([])
    load()
  }

  const offboard = async () => {
    if (!offboarding) return
    if (!confirm(`Offboard ${offboarding.name}? All assigned assets will be returned.`)) return
    const res = await fetch("/api/employees/offboard", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employee_id: offboarding.id, confirm: true }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    const data = await res.json()
    toast.success(`Offboarded — ${data.returned_assets} assets returned`)
    setOffboarding(null)
    setOffboardOpen(false)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold">Employees</h1>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => window.open("/api/employees/export?fmt=csv")}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
          {isAdmin && (<>
          <Dialog open={onboardOpen} onOpenChange={(v) => { setOnboardOpen(v); if (v) loadAssets() }}>
            <DialogTrigger asChild>
              <Button variant="secondary"><UserPlus className="h-4 w-4 mr-2" /> Onboard</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Onboard Employee</DialogTitle></DialogHeader>
              <form onSubmit={onboard} className="space-y-4">
                <div><Label>Name *</Label><Input name="name" required /></div>
                <div><Label>Email *</Label><Input name="email" type="email" required /></div>
                <div><Label>Phone</Label><Input name="phone" /></div>
                <div><Label>Designation</Label><Input name="designation" /></div>
                <div><Label>Department</Label><Input name="department" /></div>
                <div><Label>Office Location</Label><Input name="office_location" /></div>
                <div><Label>Assign Assets</Label>
                  <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                    {availableAssets.length === 0 && <p className="text-xs text-muted-foreground p-2">No available assets</p>}
                    {availableAssets.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 text-sm p-1 hover:bg-muted rounded cursor-pointer">
                        <Checkbox
                          checked={selectedAssets.includes(a.id)}
                          onCheckedChange={(checked) => {
                            setSelectedAssets(checked ? [...selectedAssets, a.id] : selectedAssets.filter((id) => id !== a.id))
                          }}
                        />
                        {a.asset_name} <span className="text-muted-foreground">({a.asset_unique_id})</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full">Onboard & Assign</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
              <form onSubmit={createEmployee} className="space-y-4">
                <div><Label>Name</Label><Input name="name" required /></div>
                <div><Label>Email</Label><Input name="email" type="email" required /></div>
                <div><Label>Phone</Label><Input name="phone" /></div>
                <div><Label>Designation</Label><Input name="designation" /></div>
                <div><Label>Department</Label><Input name="department" /></div>
                <div><Label>Office Location</Label><Input name="office_location" /></div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
          </>)}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">ID</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Designation</th>
                <th className="p-3 font-medium">Department</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><TableSkeleton rows={5} cols={7} /></td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={7} className="p-6"><EmptyState title="No employees found" description="No employees match your current filters." /></td></tr>
              ) : employees.map((emp) => (
                <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3">{emp.employee_id}</td>
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3">{emp.email}</td>
                  <td className="p-3">{emp.designation || "-"}</td>
                  <td className="p-3">{emp.department || "-"}</td>
                  <td className="p-3"><Badge className={statusColor(emp.employment_status)}>{emp.employment_status}</Badge></td>
                  <td className="p-3">
                    {isAdmin ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(emp); setEditOpen(true) }}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-orange-600" onClick={() => { setOffboarding(emp); setOffboardOpen(true) }}>Offboard</Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivate(emp.id)}>Deactivate</Button>
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

      <Pagination page={employeePage} totalPages={Math.ceil(employeeTotal / perPage)} onPageChange={setEmployeePage} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={updateEmployee} className="space-y-4">
              <div><Label>Name</Label><Input name="name" defaultValue={editing.name} required /></div>
              <div><Label>Email</Label><Input name="email" type="email" defaultValue={editing.email} required /></div>
              <div><Label>Phone</Label><Input name="phone" defaultValue={editing.phone ?? ""} /></div>
              <div><Label>Designation</Label><Input name="designation" defaultValue={editing.designation ?? ""} /></div>
              <div><Label>Department</Label><Input name="department" defaultValue={editing.department ?? ""} /></div>
              <div><Label>Office Location</Label><Input name="office_location" defaultValue={editing.office_location ?? ""} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={offboardOpen} onOpenChange={setOffboardOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Offboard Employee</DialogTitle></DialogHeader>
          {offboarding && (
            <div className="space-y-4">
              <p className="text-sm">
                Offboarding <strong>{offboarding.name}</strong> ({offboarding.employee_id})
              </p>
              <p className="text-sm text-muted-foreground">
                All currently assigned assets will be auto-returned. This action cannot be undone.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setOffboardOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={offboard}>
                  <UserX className="h-4 w-4 mr-2" /> Confirm Offboard
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
