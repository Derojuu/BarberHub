import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"

const prisma = new PrismaClient()
const COUPON_COST = 100 // adjust if you keep this configurable elsewhere

function generateCode(len = 8) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let s = ""
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export async function GET() {
  try {
    return NextResponse.json({ cost: COUPON_COST })
  } catch (err) {
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    // coerce decoded.id to a numeric userId for Prisma (Prisma schema uses number ids)
    const userIdNum = Number(decoded.id)
    if (!Number.isFinite(userIdNum) || Number.isNaN(userIdNum)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 })
    }

    // Atomic transaction: re-read user's pointsBalance, validate, decrement, create coupon
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userIdNum } })
      if (!user) throw new Error("User not found")

      const balance = user.pointsBalance ?? 0
      if (balance < COUPON_COST) {
        throw new Error("Insufficient points")
      }

      const newBalance = Math.max(0, balance - COUPON_COST)

      // create coupon and update balance in single transaction
      const coupon = await tx.coupon.create({
        data: {
          userId: userIdNum,
          code: generateCode(10),
          isUsed: false,
        },
      })

      await tx.user.update({
        where: { id: userIdNum },
        data: { pointsBalance: newBalance },
      })

      return { coupon, newBalance }
    })

    return NextResponse.json({ coupon: result.coupon, pointsBalance: result.newBalance })
  } catch (error: any) {
    if (error.message === "Insufficient points") {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Buy coupon error:", error)
    return NextResponse.json({ error: "Failed to buy coupon" }, { status: 500 })
  }
}
