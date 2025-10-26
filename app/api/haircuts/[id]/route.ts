import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const haircut = await prisma.haircut.update({
      where: { id: Number.parseInt(params.id) },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(price && { price: Number.parseFloat(price) }),
        ...(pointValue && { pointValue: Number.parseInt(pointValue) }),
        ...(image && { image }),
      },
    })

    return NextResponse.json({ haircut })
  } catch (error) {
    console.error("Update haircut error:", error)
    return NextResponse.json({ error: "Failed to update haircut" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    await prisma.haircut.delete({
      where: { id: Number.parseInt(params.id) },
    })

    return NextResponse.json({ message: "Haircut deleted" })
  } catch (error) {
    console.error("Delete haircut error:", error)
    return NextResponse.json({ error: "Failed to delete haircut" }, { status: 500 })
  }
}
