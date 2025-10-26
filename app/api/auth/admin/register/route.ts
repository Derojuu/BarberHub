import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { hashPassword, generateToken } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, confirmPassword, adminKey } = await request.json()

    // Validate admin secret key
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: "Invalid admin key" }, { status: 403 })
    }

    // Validate input
    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: "admin",
      },
    })

    // Generate token
    const token = generateToken(admin.id, admin.role)

    return NextResponse.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error("Admin registration error:", error)
    return NextResponse.json({ error: "Admin registration failed" }, { status: 500 })
  }
}
