"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Scan, Search, Camera, CameraOff, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function ScanPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [scanning, setScanning] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const lookup = () => {
    if (!query.trim()) return
    try {
      const parsed = JSON.parse(query)
      if (parsed.url) { router.push(parsed.url); return }
      if (parsed.id) { router.push(`/assets/${parsed.id}`); return }
    } catch {}
    router.push(`/assets/${query.trim()}`)
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch {
      toast.error("Camera access denied. Use file upload instead.")
    }
  }

  const captureFrame = async () => {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      stopCamera()
      setScanning(true)
      const formData = new FormData()
      formData.append("image", blob, "frame.jpg")
      try {
        const res = await fetch("/api/scan", { method: "POST", body: formData })
        if (!res.ok) { toast.error((await res.json()).detail); return }
        const data = await res.json()
        if (data.asset_id) router.push(`/assets/${data.asset_id}`)
      } catch {
        toast.error("Failed to scan image")
      } finally {
        setScanning(false)
      }
    }, "image/jpeg", 0.8)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    stopCamera()
    setScanning(true)
    const formData = new FormData()
    formData.append("image", file)
    try {
      const res = await fetch("/api/scan", { method: "POST", body: formData })
      if (!res.ok) { toast.error((await res.json()).detail); return }
      const data = await res.json()
      if (data.asset_id) router.push(`/assets/${data.asset_id}`)
    } catch {
      toast.error("Failed to scan image")
    } finally {
      setScanning(false)
      e.target.value = ""
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" /> Scan Asset
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Asset ID, unique ID, or paste QR data..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && lookup()}
            />
            <Button onClick={lookup}><Search className="h-4 w-4" /></Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">Or scan a QR code</p>

            {cameraActive ? (
              <div className="space-y-2">
                <video ref={videoRef} className="w-full max-h-64 rounded-lg bg-black" playsInline />
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={captureFrame} disabled={scanning}>
                    <Camera className="h-4 w-4 mr-1" /> {scanning ? "Scanning..." : "Capture"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={stopCamera}>
                    <CameraOff className="h-4 w-4 mr-1" /> Close Camera
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={startCamera}>
                  <Camera className="h-4 w-4 mr-1" /> Open Camera
                </Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-1" /> Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={scanning}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
