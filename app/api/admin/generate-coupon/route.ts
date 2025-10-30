import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // validation
    const code = String(body?.code ?? `C-${Date.now().toString(36)}`)

    // server-only DB call
    const data: any = { code, isUsed: false }
    if (body?.expiresAt) data.expiresAt = new Date(body.expiresAt)

    const coupon = await prisma.coupon.create({
      data,
    })

    return NextResponse.json({ coupon })
  } catch (err) {
    console.error("generate-coupon error:", err)
    return NextResponse.json({ error: "Failed to generate coupon" }, { status: 500 })
  }
}
