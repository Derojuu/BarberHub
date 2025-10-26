import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "Missing coupon code" }, { status: 400 })
    }

    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      include: { user: true },
    })

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    }

    if (coupon.isUsed) {
      return NextResponse.json({ error: "Coupon already used" }, { status: 400 })
    }

    if (coupon.expiryDate && new Date() > coupon.expiryDate) {
      return NextResponse.json({ error: "Coupon expired" }, { status: 400 })
    }

    // Mark coupon as used
    const updatedCoupon = await prisma.coupon.update({
      where: { id: coupon.id },
      data: { isUsed: true },
      include: { user: true },
    })

    return NextResponse.json({ updatedCoupon })
  } catch (error) {
    console.error("Verify coupon error:", error)
    return NextResponse.json({ error: "Failed to verify coupon" }, { status: 500 })
  }
}
