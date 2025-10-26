import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const haircuts = await prisma.haircut.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ haircuts })
  } catch (error) {
    console.error("Fetch haircuts error:", error)
    return NextResponse.json({ error: "Failed to fetch haircuts" }, { status: 500 })
  }
}

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

    const { title, description, price, pointValue, image } = await request.json()

    if (!title || !description || !price || !pointValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const haircut = await prisma.haircut.create({
      data: {
        title,
        description,
        price: Number.parseFloat(price),
        pointValue: Number.parseInt(pointValue),
        image: image || "/placeholder.svg",
      },
    })

    return NextResponse.json({ haircut }, { status: 201 })
  } catch (error) {
    console.error("Create haircut error:", error)
    return NextResponse.json({ error: "Failed to create haircut" }, { status: 500 })
  }
}
