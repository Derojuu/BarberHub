import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"
import { nanoid } from "nanoid"

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

    const { userId, expiryDate } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 })
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: Number.parseInt(userId) },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate unique coupon code
    const couponCode = `BARBER-FREE-${nanoid(8).toUpperCase()}`

    const coupon = await prisma.coupon.create({
      data: {
        userId: Number.parseInt(userId),
        code: couponCode,
        isUsed: false,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error("Generate coupon error:", error)
    return NextResponse.json({ error: "Failed to generate coupon" }, { status: 500 })
  }
}
