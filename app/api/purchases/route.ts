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
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { haircutId } = await request.json()
    if (!haircutId) {
      return NextResponse.json({ error: "Missing haircutId" }, { status: 400 })
    }

    const userIdNum = Number(decoded.id)
    if (!Number.isFinite(userIdNum) || Number.isNaN(userIdNum)) {
      return NextResponse.json({ error: "Invalid token payload" }, { status: 401 })
    }

    // read haircut to determine points value
    const hid = Number.parseInt(String(haircutId))
    if (!Number.isFinite(hid) || Number.isNaN(hid)) {
      return NextResponse.json({ error: "Invalid haircutId" }, { status: 400 })
    }

    const haircut = await prisma.haircut.findUnique({ where: { id: hid } })
    if (!haircut) {
      return NextResponse.json({ error: "Haircut not found" }, { status: 404 })
    }

    // determine points to award for this haircut (use schema field `pointValue`)
    const pointsValue = Number(haircut.pointValue ?? 0)

    // create pending Points record with the correct points value
    const pointsRecord = await prisma.points.create({
      data: {
        userId: userIdNum,
        haircutId: hid,
        points: pointsValue,
        status: "pending",
      },
    })

    return NextResponse.json({ points: pointsRecord }, { status: 201 })
  } catch (err) {
    console.error("Create purchase error:", err)
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 })
  }
}
