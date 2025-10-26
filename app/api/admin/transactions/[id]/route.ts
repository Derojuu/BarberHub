import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { status } = await request.json()
    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 })
    }

    const pointId = Number(params.id)
    const updated = await prisma.points.update({
      where: { id: pointId },
      data: { status },
      include: { user: true, haircut: true },
    })

    const transaction = {
      id: String(updated.id),
      userId: String(updated.userId),
      userName: updated.user?.username || "",
      amount: updated.haircut?.price || 0,
      points: updated.points,
      status: updated.status,
      createdAt: updated.createdAt,
    }

    return NextResponse.json({ message: "Transaction updated", transaction })
  } catch (error) {
    console.error("Failed to update transaction:", error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}
