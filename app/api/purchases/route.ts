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
    if (!decoded || decoded.role !== "customer") {
      return NextResponse.json({ error: "Customer access required" }, { status: 403 })
    }

    const { haircutId } = await request.json()

    if (!haircutId) {
      return NextResponse.json({ error: "Missing haircutId" }, { status: 400 })
    }

    // Get haircut to verify it exists and get point value
    const haircut = await prisma.haircut.findUnique({
      where: { id: Number.parseInt(haircutId) },
    })

    if (!haircut) {
      return NextResponse.json({ error: "Haircut not found" }, { status: 404 })
    }

    // Create pending points record
    const points = await prisma.points.create({
      data: {
        userId: decoded.userId,
        haircutId: Number.parseInt(haircutId),
        points: haircut.pointValue,
        status: "pending",
      },
      include: {
        haircut: true,
        user: true,
      },
    })

    return NextResponse.json({ points }, { status: 201 })
  } catch (error) {
    console.error("Purchase error:", error)
    return NextResponse.json({ error: "Failed to process purchase" }, { status: 500 })
  }
}
