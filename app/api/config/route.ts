import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

// central place for small client-visible config values
const prisma = new PrismaClient()

const COUPON_COST = 100

export async function GET(_request: NextRequest) {
  try {
    // In the future we may fetch some values from the DB; keep this simple for now
    return NextResponse.json({ couponCost: COUPON_COST })
  } catch (err) {
    console.error("Config route error:", err)
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 })
  }
}
