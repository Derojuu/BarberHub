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
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { pointsId, status } = await request.json()

    if (!pointsId || !["approved", "denied"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const pid = Number.parseInt(pointsId)

    // Load existing points record to detect status transition
    const existing = await prisma.points.findUnique({ where: { id: pid } })
    if (!existing) {
      return NextResponse.json({ error: "Points record not found" }, { status: 404 })
    }

    // Update points status and adjust user's pointsBalance atomically with safety checks
    const updatedPoints = await prisma.$transaction(async (tx) => {
      const updated = await tx.points.update({
        where: { id: pid },
        data: { status },
        include: { user: true, haircut: true },
      })

      // Load user's current balance inside the transaction
  const userRecord = (await tx.user.findUnique({ where: { id: updated.userId } })) as any
  if (!userRecord) throw new Error("User not found")

  let newBalance = (userRecord.pointsBalance ?? 0) as number

      // If status changed to approved from non-approved, increment user's balance
      if (existing.status !== "approved" && status === "approved") {
        newBalance = newBalance + updated.points
      }

      // If previously approved but now changed away from approved, decrement user's balance (clamp at 0)
      if (existing.status === "approved" && status !== "approved") {
        newBalance = Math.max(0, newBalance - updated.points)
      }

      // Persist new balance if it changed
      if (newBalance !== (userRecord.pointsBalance ?? 0)) {
        await tx.user.update({ where: { id: updated.userId }, data: ({ pointsBalance: newBalance } as any) })
      }

      return updated
    })

    return NextResponse.json({ updatedPoints })
  } catch (error) {
    console.error("Validate points error:", error)
    return NextResponse.json({ error: "Failed to validate points" }, { status: 500 })
  }
}
