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
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const pendingPoints = await prisma.points.findMany({
      where: { status: "pending" },
      include: {
        user: true,
        haircut: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ pendingPoints })
  } catch (error) {
    console.error("Fetch pending validations error:", error)
    return NextResponse.json({ error: "Failed to fetch pending validations" }, { status: 500 })
  }
}
