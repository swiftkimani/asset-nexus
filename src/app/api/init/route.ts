import { NextResponse } from "next/server"
import { ensureInitialized } from "@/lib/init"

export async function POST() {
  await ensureInitialized()
  return NextResponse.json({ status: "ok" })
}
