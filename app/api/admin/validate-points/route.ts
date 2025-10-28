import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { verifyToken } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { pointsId, status } = await request.json()
    if (!pointsId || !["approved", "denied"].includes(status)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const pid = Number(pointsId)
    if (!Number.isFinite(pid)) return NextResponse.json({ error: "Invalid pointsId" }, { status: 400 })

    // Load existing points record to detect status transition
    const existing = await prisma.points.findUnique({ where: { id: pid } })
    if (!existing) return NextResponse.json({ error: "Points record not found" }, { status: 404 })

    const updated = await prisma.$transaction(async (tx) => {
      // update points record status first
      const updatedPoints = await tx.points.update({
        where: { id: pid },
        data: { status },
      })

      // only adjust user's pointsBalance when status actually changes
      if (existing.status !== updatedPoints.status) {
        const pts = Number(existing.points ?? 0)
        const userId = existing.userId

        // load user
        const user = await tx.user.findUnique({ where: { id: userId } })
        if (!user) throw new Error("User not found")

        let newBalance = Number(user.pointsBalance ?? 0)
        if (existing.status !== "approved" && updatedPoints.status === "approved") {
          // pending -> approved : add points
          newBalance = newBalance + pts
        } else if (existing.status === "approved" && updatedPoints.status !== "approved") {
          // approved -> denied/revoked : subtract points (safety)
          newBalance = Math.max(0, newBalance - pts)
        }

        // persist new balance
        await tx.user.update({
          where: { id: userId },
          data: { pointsBalance: newBalance },
        })
      }

      return updatedPoints
    })

    return NextResponse.json({ points: updated })
  } catch (error) {
    console.error("validate-points error:", error)
    return NextResponse.json({ error: "Failed to validate points" }, { status: 500 })
  }
}
