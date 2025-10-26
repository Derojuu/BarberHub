import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"

const prisma = new PrismaClient()

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

    // Get all approved points for customer
    const approvedPoints = await prisma.points.findMany({
      where: {
        userId: decoded.userId,
        status: "approved",
      },
      include: { haircut: true },
    })

    const totalPoints = approvedPoints.reduce((sum, p) => sum + p.points, 0)

    return NextResponse.json({
      totalPoints,
      approvedPoints,
    })
  } catch (error) {
    console.error("Fetch customer points error:", error)
    return NextResponse.json({ error: "Failed to fetch points" }, { status: 500 })
  }
}
