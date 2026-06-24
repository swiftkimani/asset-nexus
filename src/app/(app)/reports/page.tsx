"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, FileText, Users, Package, Wrench, Clock, Sliders } from "lucide-react"
import { toast } from "sonner"

const reports = [
  { name: "assets-by-employee", label: "Assets by Employee", icon: Users },
  { name: "unassigned-assets", label: "Unassigned Assets", icon: Package },
  { name: "under-repair", label: "Under Repair", icon: Wrench },
  { name: "warranty-expiring", label: "Warranty Expiring", icon: Clock },
]

const columns = [
  { key: "asset_id", label: "Asset ID" },
  { key: "asset_name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "brand", label: "Brand" },
  { key: "model", label: "Model" },
  { key: "serial_number", label: "Serial" },
  { key: "purchase_cost", label: "Cost" },
  { key: "status", label: "Status" },
  { key: "asset_location", label: "Location" },
  { key: "employee", label: "Employee" },
  { key: "department", label: "Department" },
]

export default function ReportsPage() {
  const [employeeFile, setEmployeeFile] = useState<File | null>(null)
  const [assetFile, setAssetFile] = useState<File | null>(null)
  const [selectedColumns, setSelectedColumns] = useState<string[]>(["asset_id", "asset_name", "status"])
  const [generating, setGenerating] = useState(false)

  const downloadReport = (name: string) => {
    window.open(`/api/reports?name=${name}&fmt=csv`)
  }

  const importFile = async (endpoint: string, file: File | null, reset: (v: null) => void) => {
    if (!file) { toast.error("Please select a file"); return }
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch(endpoint, { method: "POST", body: formData })
    if (!res.ok) { toast.error((await res.json()).detail); return }
    const data = await res.json()
    toast.success(data.message)
    reset(null)
  }

  const toggleColumn = (key: string) => {
    setSelectedColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    )
  }

  const generateCustomReport = () => {
    if (selectedColumns.length === 0) { toast.error("Select at least one column"); return }
    setGenerating(true)
    window.open(`/api/reports/custom?columns=${selectedColumns.join(",")}&fmt=csv`)
    setTimeout(() => setGenerating(false), 1000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold">Reports</h1>

      <Tabs defaultValue="reports">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="reports" className="flex-1 sm:flex-none"><FileText className="h-4 w-4 mr-2" /> Reports</TabsTrigger>
          <TabsTrigger value="import" className="flex-1 sm:flex-none"><Upload className="h-4 w-4 mr-2" /> Import</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((r) => {
              const Icon = r.icon
              return (
                <Card key={r.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Icon className="h-4 w-4" /> {r.label}
                      </CardTitle>
                      <Button variant="outline" size="sm" onClick={() => downloadReport(r.name)}>
                        <Download className="h-3 w-3 mr-1" /> CSV
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Download {r.label.toLowerCase()} report</p>
                  </CardContent>
                </Card>
              )
            })}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Sliders className="h-4 w-4" /> Custom Report
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Select columns to include in your report</p>
                <div className="grid grid-cols-2 gap-2">
                  {columns.map((col) => (
                    <label key={col.key} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedColumns.includes(col.key)}
                        onCheckedChange={() => toggleColumn(col.key)}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateCustomReport}
                  disabled={generating || selectedColumns.length === 0}
                >
                  <Download className="h-3 w-3 mr-1" /> Generate CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="import" className="space-y-6 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Import Employees</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Excel file (.xlsx)</Label>
                <Input type="file" accept=".xlsx" onChange={(e) => setEmployeeFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={() => importFile("/api/reports/import/employees", employeeFile, setEmployeeFile)} disabled={!employeeFile}>
                <Upload className="h-4 w-4 mr-2" /> Import Employees
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Import Assets</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Excel file (.xlsx)</Label>
                <Input type="file" accept=".xlsx" onChange={(e) => setAssetFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={() => importFile("/api/reports/import/assets", assetFile, setAssetFile)} disabled={!assetFile}>
                <Upload className="h-4 w-4 mr-2" /> Import Assets
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
