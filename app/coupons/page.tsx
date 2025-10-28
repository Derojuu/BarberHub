"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { updateLocalUserBalance } from "@/lib/utils"

interface Coupon {
  id: number
  code: string
  isUsed: boolean
  createdAt: string
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [points, setPoints] = useState<number>(0)
  const [cost, setCost] = useState<number>(100)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
      // fetch cost
      const cfgRes = await fetch("/api/config")
      if (cfgRes.ok) {
        const cfg = await cfgRes.json()
        if (cfg?.couponCost) setCost(Number(cfg.couponCost))
      }

      // fetch user points and coupons
      const token = localStorage.getItem("token")
      if (!token) return

      const [pointsRes, couponsRes] = await Promise.all([
        fetch("/api/customer/points", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/customer/coupons", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      ])

      if (pointsRes.ok) {
        const p = await pointsRes.json()
        const pts = p.pointsBalance ?? p.points ?? p.totalPoints ?? 0
        setPoints(pts)
        // persist authoritative balance safely
        updateLocalUserBalance(Number(pts))
      } else {
        setPoints(0)
      }

      if (couponsRes.ok) {
        const c = await couponsRes.json()
        setCoupons(Array.isArray(c) ? c : c.coupons ?? [])
      } else {
        setCoupons([])
      }
    } catch (err) {
      console.error("Coupons fetch error", err)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 30_000) // poll every 30s
    return () => clearInterval(id)
  }, [fetchData])

  const buyCoupon = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || "Failed to buy coupon")
      } else {
        // update UI: add new coupon and update points
        setCoupons((prev) => [data.coupon, ...prev])
        const newPts = Number(data.pointsBalance ?? 0)
        setPoints(newPts)
        updateLocalUserBalance(newPts)
        // show nicer UI: use toast or alert
        alert(`Coupon purchased: ${data.coupon.code}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to buy coupon")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Your Coupons</h1>

      <div className="mt-4 mb-6 flex items-center gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Points balance</p>
          <p className="text-2xl font-bold">{points}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Coupon cost</p>
          <p className="text-2xl font-bold">{cost}</p>
        </div>

        <div>
          <button
            onClick={buyCoupon}
            disabled={loading || points < cost}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {loading ? "Buying..." : `Buy Free Haircut — ${cost} pts`}
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">Purchased Coupons</h2>
        {coupons.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't purchased any coupons yet.</p>
        ) : (
          <ul className="space-y-3">
            {coupons.map((c) => (
              <li key={c.id} className="p-4 border rounded flex justify-between items-center">
                <div>
                  <div className="font-medium">{c.code}</div>
                  <div className="text-xs text-muted-foreground">Purchased: {new Date(c.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  {c.isUsed ? (
                    <span className="text-sm text-red-600">Used</span>
                  ) : (
                    <button
                      className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary/90 transition"
                      onClick={() => {
                        navigator.clipboard?.writeText(c.code)
                        // keep your toast replacement if you switch alerts -> toast
                        alert("Code copied")
                      }}
                    >
                      Copy code
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
