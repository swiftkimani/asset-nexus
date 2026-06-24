"use client"

import { Button } from "@/components/ui/button"

const providers = [
  { name: "google", label: "Google", icon: "G" },
  { name: "microsoft", label: "Microsoft", icon: "M" },
]

export function OAuthButtons() {
  const handleOAuth = (provider: string) => {
    window.location.href = `/api/auth/oauth/${provider}`
  }

  return (
    <div className="space-y-2">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
      </div>
      {providers.map((p) => (
        <Button key={p.name} variant="outline" className="w-full" onClick={() => handleOAuth(p.name)}>
          {p.icon} {p.label}
        </Button>
      ))}
    </div>
  )
}
