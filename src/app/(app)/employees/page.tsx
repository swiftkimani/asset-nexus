"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Download, Search } from "lucide-react"
import { toast } from "sonner"
import { statusColor } from "@/lib/utils"
import type { Employee } from "@/types"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    const res = await fetch(`/api/employees?${params}`)
    setEmployees(await res.json())
  }, [search])

  useEffect(() => { load() }, [load])

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employees</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open("/api/employees/export?fmt=csv")}>
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
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
        </div>
      </div>

      <div className="flex gap-2 max-w-sm">
        <Search className="h-4 w-4 text-muted-foreground self-center" />
        <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
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
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3">{emp.employee_id}</td>
                  <td className="p-3">{emp.name}</td>
                  <td className="p-3">{emp.email}</td>
                  <td className="p-3">{emp.designation || "-"}</td>
                  <td className="p-3">{emp.department || "-"}</td>
                  <td className="p-3"><Badge className={statusColor(emp.employment_status)}>{emp.employment_status}</Badge></td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(emp); setEditOpen(true) }}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deactivate(emp.id)}>Deactivate</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No employees found</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

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
    </div>
  )
}
