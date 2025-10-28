"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { updateLocalUserBalance } from "@/lib/utils"

interface User {
  id: string
  username: string
  email: string
  points: number
  pointsBalance?: number
  tier: string
}

interface Coupon {
  id: number
  code: string
  isUsed: boolean
  expiryDate?: string | null
  createdAt?: string
}

export default function DashboardContent({ user }: { user: User }) {
  const router = useRouter()
  const [buying, setBuying] = useState(false)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [synced, setSynced] = useState(false) // true after successful fetch from DB

  // fetchPoints made stable with useCallback so interval/focus use the same ref
  const fetchPoints = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      // force fresh data from server
      const res = await fetch("/api/customer/points", { headers, cache: "no-store" })
      const d = await res.json()
      if (res.ok) {
        const pts = d?.pointsBalance ?? d?.totalPoints ?? d?.points ?? d?.total ?? 0
        const ptsNum = Number(pts ?? 0)
        setPoints(ptsNum)
        setSynced(true)
        // persist authoritative balance safely (timestamped)
        updateLocalUserBalance(ptsNum, Date.now())
      } else {
        setPoints(0)
      }
    } catch (err) {
      console.error("fetchPoints error", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // fetchCoupons: load customer's coupons from server
  const fetchCoupons = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch("/api/customer/coupons", { headers, cache: "no-store" })
      const d = await res.json()
      if (res.ok) {
        setCoupons(d?.coupons ?? d ?? [])
      } else {
        setCoupons([])
      }
    } catch (err) {
      console.error("fetchCoupons error", err)
      toast.error("Failed to load coupons")
      setCoupons([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Buy coupon (free haircut) for a fixed cost on the server
  const handleBuyCoupon = async () => {
    try {
      if (buying) return
      setBuying(true)

      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to buy coupon")
        return
      }

      // show coupon code immediately
      toast.success(`Coupon purchased: ${data.coupon.code}`)

      if (data.pointsBalance !== undefined) {
        const newBalance = Number(data.pointsBalance)
        // update local UI immediately and mark as synced so we prefer server value
        setPoints(newBalance)
        setSynced(true)
        updateLocalUserBalance(newBalance)

        // reconcile with server authoritative value (force fresh)
        try {
          await fetchPoints()
        } catch (e) {
          // ignore - we already updated UI, fetchPoints will also persist localStorage
        }

        // refresh any server-rendered parts that depend on user (optional)
        try {
          router.refresh()
        } catch {}
      } else {
        // fallback: re-fetch authoritative points
        await fetchPoints()
      }

      // refresh coupons list
      await fetchCoupons()
    } catch (err) {
      console.error(err)
      toast.error("Network error while buying coupon")
    } finally {
      setBuying(false)
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold":
        return "text-yellow-600"
      case "silver":
        return "text-gray-500"
      case "bronze":
        return "text-orange-600"
      default:
        return "text-primary"
    }
  }

  // prefer live points state (from server) once synced.
  const fallback = Number(user.points ?? user.pointsBalance ?? 0)
  const currentPoints = synced ? (points ?? 0) : (points !== null ? points : fallback)
  const canBuy = currentPoints >= 100

  // initial load + keep points fresh
  useEffect(() => {
    fetchCoupons()
    fetchPoints()

    const id = setInterval(fetchPoints, 15_000)
    const onFocus = () => fetchPoints()
    window.addEventListener("focus", onFocus)

    return () => {
      clearInterval(id)
      window.removeEventListener("focus", onFocus)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8">
      {/* Points Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-accent p-6 shadow-sm">
          <p className="text-foreground opacity-60 text-sm mb-2">Total Points</p>
          <p className="text-4xl font-bold text-primary">
            {loading && !synced ? "—" : currentPoints}
            {!loading && !synced ? <span className="ml-2 text-xs text-muted-foreground">syncing…</span> : null}
          </p>
          <p className="text-xs text-foreground opacity-60 mt-2">Earn more with every visit</p>
        </div>

        <div className="bg-white rounded-lg border border-accent p-6 shadow-sm">
          <p className="text-foreground opacity-60 text-sm mb-2">Current Tier</p>
          <p className={`text-4xl font-bold capitalize ${getTierColor(user.tier)}`}>{user.tier || "Member"}</p>
          <p className="text-xs text-foreground opacity-60 mt-2">Keep earning to level up</p>
        </div>

        <div className="bg-white rounded-lg border border-accent p-6 shadow-sm">
          <p className="text-foreground opacity-60 text-sm mb-2">Next Reward</p>
          <p className="text-4xl font-bold text-primary">{Math.max(0, 100 - currentPoints)}</p>
          <p className="text-xs text-foreground opacity-60 mt-2">Points until next reward</p>

          {/* Buy coupon button */}
          <div className="mt-4">
            <button
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:opacity-90 disabled:opacity-50"
              onClick={handleBuyCoupon}
              disabled={buying || !canBuy}
            >
              {buying ? "Buying..." : `Buy Free Haircut — 100 pts`}
            </button>
          </div>
        </div>
      </div>

      {/* Available Coupons */}
      <div>
        <h2 className="text-2xl font-bold text-primary mb-6">Your Coupons</h2>
        {loading ? (
          <p className="text-foreground opacity-75">Loading coupons...</p>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-lg border border-accent p-8 text-center shadow-sm">
            <p className="text-foreground opacity-75 mb-4">No coupons available yet</p>
            <p className="text-sm text-foreground opacity-60">Earn more points to unlock exclusive coupons</p>
            <div className="mt-6">
              <button
                onClick={handleBuyCoupon}
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition"
                disabled={!canBuy || buying}
              >
                {buying ? "Buying..." : `Buy Free Haircut Coupon — 100 pts`}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-lg border-2 p-6 shadow-sm ${coupon.isUsed ? "border-accent opacity-50" : "border-primary"}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary">Free Haircut</span>
                  {coupon.isUsed && (
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">Used</span>
                  )}
                </div>
                <p className="font-mono text-lg font-bold text-foreground mb-4">{coupon.code}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(coupon.code)
                      toast.success("Coupon code copied to clipboard")
                    }}
                    disabled={coupon.isUsed}
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {coupon.isUsed ? "Already Used" : "Copy Code"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Section */}
      <div className="bg-white rounded-lg border border-accent p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-primary mb-4">Book Your Haircut</h2>
        <p className="text-foreground opacity-75 mb-6">
          Ready for your haircut? Book now and earn more points!
        </p>
        <Link
          href="/services"
          className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition inline-block text-center"
        >
          Book Haircut
        </Link>
      </div>
    </div>
  )
}
