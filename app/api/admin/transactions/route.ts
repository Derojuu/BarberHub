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

    const points = await prisma.points.findMany({
      include: { user: true, haircut: true },
      orderBy: { createdAt: "desc" },
    })

    const transactions = points.map((p) => ({
      id: String(p.id),
      userId: String(p.userId),
      userName: p.user?.username || "",
      userEmail: p.user?.email || "",
  haircutTitle: p.haircut?.title || "",
      amount: p.haircut?.price || 0,
      points: p.points,
      status: p.status,
      createdAt: p.createdAt,
    }))

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("Failed to fetch transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}
