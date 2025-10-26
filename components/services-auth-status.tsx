"use client"

import { useEffect, useState } from "react"

export default function ServicesAuthStatus({ onRefresh }: { onRefresh?: () => void }) {
  const [user, setUser] = useState<{ username?: string; email?: string } | null>(null)
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null
    if (raw) setUser(JSON.parse(raw))
    fetchPoints()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchPoints() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch("/api/customer/points", { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (res.ok) {
        setPoints(data.totalPoints ?? 0)
      }
    } catch (err) {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="mb-6 p-4 rounded-md bg-muted-foreground/5 text-sm">
        <p className="text-foreground">Log in to see your points and book services.</p>
      </div>
    )
  }

  return (
    <div className="mb-6 p-4 rounded-md bg-white border border-accent flex items-center justify-between">
      <div>
        <p className="text-sm text-foreground opacity-60">Signed in as</p>
        <p className="font-semibold text-primary">{user.username || user.email}</p>
        <p className="text-xs text-foreground opacity-60">{user.email}</p>
      </div>

      <div className="text-right">
        <p className="text-sm text-foreground opacity-60">Available Points</p>
        <p className="font-bold text-2xl text-primary">{loading ? "..." : points ?? 0} pts</p>
        <div className="mt-2">
          <button
            className="px-3 py-1 text-sm bg-primary text-white rounded-md"
            onClick={() => {
              fetchPoints()
              onRefresh?.()
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
