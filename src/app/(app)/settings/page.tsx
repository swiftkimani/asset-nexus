"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Shield, ShieldOff, History, Key, Clock, Copy, Check, Calendar, Play, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { UserOut, ReportSchedule } from "@/types"
import { useAuth } from "@/components/auth-provider"

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

interface ApiToken {
  id: number
  name: string
  last_used_at: string | null
  expires_at: string | null
  is_active: number
  created_at: string
}

export default function SettingsPage() {
  const { user } = useAuth()
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
    const password = prompt("Enter new password (min 8 chars, upper, lower, digit):")
    if (!password) return
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Password must be at least 8 characters with uppercase, lowercase, and digit")
      return
    }
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

  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [tokenOpen, setTokenOpen] = useState(false)
  const [tokenName, setTokenName] = useState("")
  const [rawToken, setRawToken] = useState("")
  const [copied, setCopied] = useState(false)

  const loadTokens = useCallback(async () => {
    const res = await fetch("/api/auth/tokens")
    if (res.ok) setTokens(await res.json())
  }, [])

  useEffect(() => { loadTokens() }, [loadTokens])

  const generateToken = async () => {
    if (!tokenName.trim()) { toast.error("Token name is required"); return }
    const res = await fetch("/api/auth/tokens", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tokenName }),
    })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    const data = await res.json()
    setRawToken(data.token)
    toast.success("Token generated")
    loadTokens()
  }

  const revokeToken = async (id: number) => {
    if (!confirm("Revoke this token? It will no longer work.")) return
    const res = await fetch(`/api/auth/tokens/${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Token revoked")
    loadTokens()
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(rawToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expireMinutes = Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_EXPIRE_MINUTES || "60")

  return (
    <div className="space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>

      <Tabs defaultValue="users">
        <TabsList className="w-full sm:w-auto flex-wrap">
          <TabsTrigger value="users" className="flex-1 sm:flex-none"><Shield className="h-4 w-4 mr-2" /> Users</TabsTrigger>
          <TabsTrigger value="tokens" className="flex-1 sm:flex-none"><Key className="h-4 w-4 mr-2" /> API Tokens</TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1 sm:flex-none"><Clock className="h-4 w-4 mr-2" /> Sessions</TabsTrigger>
          <TabsTrigger value="schedules" className="flex-1 sm:flex-none"><Calendar className="h-4 w-4 mr-2" /> Schedule Reports</TabsTrigger>
          <TabsTrigger value="audit" className="flex-1 sm:flex-none"><History className="h-4 w-4 mr-2" /> Audit Log</TabsTrigger>
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
                  <div><Label>Password</Label><Input name="password" type="password" required minLength={8} /></div>
                  <div><Label>Role</Label>
                    <Select name="role" required>
                      <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Department (optional)</Label>
                    <Select name="department">
                      <SelectTrigger><SelectValue placeholder="No restriction" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No restriction</SelectItem>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
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
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium">Department</th>
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
                      <td className="p-3 text-xs text-muted-foreground">{(u as any).department || "-"}</td>
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Dialog open={tokenOpen} onOpenChange={(v) => { setTokenOpen(v); if (!v) setRawToken("") }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Generate Token</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Generate API Token</DialogTitle></DialogHeader>
                {!rawToken ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Tokens are used for API authentication. Copy the token immediately — it will not be shown again.</p>
                    <div><Label>Token Name</Label><Input value={tokenName} onChange={(e) => setTokenName(e.target.value)} placeholder="e.g. CI/CD Pipeline" /></div>
                    <Button onClick={generateToken} className="w-full">Generate</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Copy this token now. You will not be able to see it again.</p>
                    <div className="flex gap-2">
                      <Input value={rawToken} readOnly className="font-mono text-xs" />
                      <Button variant="outline" size="icon" onClick={handleCopy}>
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <DialogClose asChild>
                      <Button variant="outline" className="w-full">Done</Button>
                    </DialogClose>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle>API Tokens</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Last Used</th>
                    <th className="p-3 font-medium">Expires</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-3">{t.name}</td>
                      <td className="p-3 text-xs text-muted-foreground">{t.last_used_at ? new Date(t.last_used_at).toLocaleString() : "Never"}</td>
                      <td className="p-3 text-xs text-muted-foreground">{t.expires_at ? new Date(t.expires_at).toLocaleString() : "Never"}</td>
                      <td className="p-3">
                        <Badge className={t.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {t.is_active ? "Active" : "Revoked"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {t.is_active ? (
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => revokeToken(t.id)}>Revoke</Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tokens.length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No API tokens generated yet</td></tr>
                  )}
                </tbody>
              </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Session Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Token Type:</strong> JWT (JSON Web Token)
                </p>
                <p className="text-sm">
                  <strong>Expires In:</strong> {expireMinutes} minutes
                </p>
                <p className="text-sm">
                  <strong>Signed in as:</strong> {user?.email}
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium mb-1">How session management works</p>
                <p>JWT tokens expire after {expireMinutes} minutes. You stay logged in as long as the token is valid.</p>
                <p className="mt-2">Changing your password will increment the token version, immediately invalidating all existing sessions. All users will need to log in again with the new credentials.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4 mt-4">
          <SchedulesTab />
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
              <div className="overflow-x-auto">
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SchedulesTab() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ReportSchedule | null>(null)

  const load = useCallback(async () => {
    const res = await fetch("/api/reports/schedule")
    if (res.ok) setSchedules(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form)

    if (editing) {
      const res = await fetch(`/api/reports/schedule/${editing.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error((await res.json()).detail); return }
      toast.success("Schedule updated")
    } else {
      const res = await fetch("/api/reports/schedule", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { toast.error((await res.json()).detail); return }
      toast.success("Schedule created")
    }

    setOpen(false)
    setEditing(null)
    load()
  }

  const handleDelete = async (s: ReportSchedule) => {
    if (!confirm(`Deactivate schedule "${s.name}"?`)) return
    const res = await fetch(`/api/reports/schedule/${s.id}`, { method: "DELETE" })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    toast.success("Schedule deactivated")
    load()
  }

  const handleEdit = (s: ReportSchedule) => {
    setEditing(s)
    setOpen(true)
  }

  const handleSendNow = async (s: ReportSchedule) => {
    const res = await fetch("/api/cron/reports")
    if (!res.ok) { toast.error("Failed to trigger reports"); return }
    toast.success("Reports triggered")
    load()
  }

  const reportTypes = [
    { value: "recent-assignments", label: "Recent Assignments" },
    { value: "assets-by-employee", label: "Assets by Employee" },
    { value: "unassigned-assets", label: "Unassigned Assets" },
    { value: "under-repair", label: "Under Repair" },
    { value: "warranty-expiring", label: "Warranty Expiring" },
  ]

  const frequencies = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null) }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Schedule" : "New Schedule"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><Label>Name</Label><Input name="name" required defaultValue={editing?.name || ""} /></div>
              <div><Label>Report Type</Label>
                <Select name="report_type" required defaultValue={editing?.report_type || ""}>
                  <SelectTrigger><SelectValue placeholder="Select report" /></SelectTrigger>
                  <SelectContent>
                    {reportTypes.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Frequency</Label>
                <Select name="frequency" required defaultValue={editing?.frequency || ""}>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Recipients (comma-separated emails)</Label><Input name="recipients" required defaultValue={editing?.recipients || ""} placeholder="admin@example.com, manager@example.com" /></div>
              <div><Label>Format</Label>
                <Select name="format" defaultValue={editing?.format || "csv"}>
                  <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">XLSX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{editing ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Scheduled Reports</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Report Type</th>
                <th className="p-3 font-medium">Frequency</th>
                <th className="p-3 font-medium">Recipients</th>
                <th className="p-3 font-medium">Next Run</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-xs">{s.report_type}</td>
                  <td className="p-3 text-xs capitalize">{s.frequency}</td>
                  <td className="p-3 text-xs text-muted-foreground">{s.recipients}</td>
                  <td className="p-3 text-xs text-muted-foreground">{s.next_run_at?.replace("T", " ").slice(0, 16)}</td>
                  <td className="p-3">
                    <Badge className={s.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {s.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(s)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No schedules yet</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
