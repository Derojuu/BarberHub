import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"
import { nanoid } from "nanoid"

const prisma = new PrismaClient()

const COUPON_COST = 100 // points required to buy a free haircut coupon

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Return coupons assigned to the authenticated user
    const coupons = await prisma.coupon.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ coupons })
  } catch (error) {
    console.error("Fetch coupons error:", error)
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Customer redeems points to buy a coupon
    const { expiryDate } = await request.json()

    // Reload user to get latest balance
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (((user as any).pointsBalance ?? 0) < COUPON_COST) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 })
    }

    // Atomically re-check balance and decrement then create coupon inside a transaction
    const couponCode = `BARBER-FREE-${nanoid(8).toUpperCase()}`

    const result = await prisma.$transaction(async (tx) => {
      // cast to any to avoid TS errors if Prisma client hasn't been regenerated locally
      const freshUser = (await tx.user.findUnique({ where: { id: user.id } })) as any
      if (!freshUser) throw new Error("User not found")
      if ((freshUser.pointsBalance ?? 0) < COUPON_COST) {
        throw new Error("Insufficient points")
      }

  const updatedUser = (await tx.user.update({ where: { id: user.id }, data: ({ pointsBalance: { decrement: COUPON_COST } } as any) })) as any

      const coupon = await tx.coupon.create({
        data: {
          userId: user.id,
          code: couponCode,
          isUsed: false,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
        },
      })

      return { updatedUser, coupon }
    })

    return NextResponse.json({ coupon: result.coupon, pointsBalance: (result.updatedUser as any).pointsBalance })
  } catch (error) {
    console.error("Buy coupon error:", error)
    return NextResponse.json({ error: "Failed to buy coupon" }, { status: 500 })
  }
}
