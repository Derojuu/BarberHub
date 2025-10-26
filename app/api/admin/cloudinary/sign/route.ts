import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { verifyToken } from "@/lib/auth"

export const runtime = "nodejs"

function parseCloudinaryUrl(url: string) {
  // cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/)
  if (!m) return null
  return { api_key: m[1], api_secret: m[2], cloud_name: m[3] }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const CLOUDINARY_URL = process.env.CLOUDINARY_URL || ""
    const parsed = parseCloudinaryUrl(CLOUDINARY_URL)
    if (!parsed) return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 })

    const timestamp = Math.floor(Date.now() / 1000)
    const toSign = `timestamp=${timestamp}`
    const signature = crypto.createHash("sha1").update(toSign + parsed.api_secret).digest("hex")

    return NextResponse.json({
      apiKey: parsed.api_key,
      cloudName: parsed.cloud_name,
      timestamp,
      signature,
    })
  } catch (err) {
    console.error("Cloudinary sign error:", err)
    return NextResponse.json({ error: "Failed to sign" }, { status: 500 })
  }
}
