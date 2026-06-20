"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Shield, ShieldOff, History } from "lucide-react"
import { toast } from "sonner"
import type { UserOut } from "@/types"

interface AuditEntry {
  id: number
  user_id: number | null
  user_name: string | null
  action: string
  entity: string
  entity_id: string | null
  details: string | null
  created_at: string
}

export default function SettingsPage() {
  const [users, setUsers] = useState<UserOut[]>([])
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch("/api/auth/users")
    if (res.ok) setUsers(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  const createUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)
    const res = await fetch("/api/auth/users", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("User created")
    setOpen(false)
    load()
  }

  const updateRole = async (id: number, role: string) => {
    const res = await fetch(`/api/auth/users/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Role updated")
    load()
  }

  const resetPassword = async (id: number) => {
    const password = prompt("Enter new password (min 6 chars):")
    if (!password || password.length < 6) { toast.error("Password must be at least 6 characters"); return }
    const res = await fetch(`/api/auth/users/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Password reset")
  }

  const deleteUser = async (id: number, email: string) => {
    if (!confirm(`Delete user ${email}?`)) return
    const res = await fetch(`/api/auth/users/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("User deleted")
    load()
  }

  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [logFilter, setLogFilter] = useState("")

  useEffect(() => {
    const params = new URLSearchParams()
    if (logFilter) params.set("entity", logFilter)
    params.set("limit", "200")
    fetch(`/api/audit-logs?${params}`).then((r) => r.json()).then(setLogs)
  }, [logFilter])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users"><Shield className="h-4 w-4 mr-2" /> Users</TabsTrigger>
          <TabsTrigger value="audit"><History className="h-4 w-4 mr-2" /> Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
                <form onSubmit={createUser} className="space-y-4">
                  <div><Label>Name</Label><Input name="name" required /></div>
                  <div><Label>Email</Label><Input name="email" type="email" required /></div>
                  <div><Label>Password</Label><Input name="password" type="password" required minLength={6} /></div>
                  <div><Label>Role</Label>
                    <Select name="role" required>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">Create</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle>Users</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium">Role</th>
                    <th className="p-3 font-medium">Created</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">
                        <Badge className={u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                          {u.role === "admin" ? <Shield className="h-3 w-3 inline mr-1" /> : <ShieldOff className="h-3 w-3 inline mr-1" />}
                          {u.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{u.created_at?.slice(0, 10)}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Select defaultValue={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="ghost" size="sm" onClick={() => resetPassword(u.id)}>Password</Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteUser(u.id, u.email)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Select value={logFilter} onValueChange={(v) => setLogFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">User</th>
                    <th className="p-3 font-medium">Action</th>
                    <th className="p-3 font-medium">Entity</th>
                    <th className="p-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{l.created_at?.replace("T", " ").slice(0, 19)}</td>
                      <td className="p-3">{l.user_name || "-"}</td>
                      <td className="p-3">
                        <Badge className={
                          l.action === "create" || l.action === "onboard" ? "bg-green-100 text-green-800" :
                          l.action === "deactivate" || l.action === "delete" || l.action === "offboard" ? "bg-red-100 text-red-800" :
                          l.action === "import" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }>{l.action}</Badge>
                      </td>
                      <td className="p-3 font-mono text-xs">{l.entity}{l.entity_id ? ` #${l.entity_id}` : ""}</td>
                      <td className="p-3 text-muted-foreground">{l.details}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No audit logs yet</td></tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
