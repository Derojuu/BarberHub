import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

// produce a token that always contains an `id` string and role
export function generateToken(userId: string | number, role: string) {
  const id = String(userId)
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" })
}

// verifyToken now returns a stable shape: { id: string; role: string } | null
export function verifyToken(token: string): { id: string; role: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    const rawId = payload?.id ?? payload?.userId ?? payload?.sub ?? payload?.user_id
    if (!rawId) return null
    return { id: String(rawId), role: String(payload?.role ?? "") }
  } catch {
    return null
  }
}
