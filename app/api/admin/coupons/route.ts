import { type NextRequest, NextResponse } from "next/server"

// Mock coupons database
const coupons: any[] = []

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { code, discount } = await request.json()

    if (!code || !discount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const coupon = {
      id: Math.random().toString(36).substr(2, 9),
      code,
      discount,
      used: false,
      createdAt: new Date(),
    }

    coupons.push(coupon)

    return NextResponse.json({
      message: "Coupon created",
      coupon,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 })
  }
}
