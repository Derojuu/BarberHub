"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface User {
  id: string
  username: string
  email: string
  points: number
  tier: string
}

interface Coupon {
  id: string
  code: string
  discount: number
  used: boolean
}

export default function DashboardContent({ user }: { user: User }) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/customer/coupons", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setCoupons(data.coupons || [])
    } catch (err) {
      console.error("Failed to fetch coupons:", err)
    } finally {
      setLoading(false)
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

  return (
    <div className="space-y-8">
      {/* Points Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-accent p-6 shadow-sm">
          <p className="text-foreground opacity-60 text-sm mb-2">Total Points</p>
          <p className="text-4xl font-bold text-primary">{user.points}</p>
          <p className="text-xs text-foreground opacity-60 mt-2">Earn more with every visit</p>
        </div>

        <div className="bg-white rounded-lg border border-accent p-6 shadow-sm">
          <p className="text-foreground opacity-60 text-sm mb-2">Current Tier</p>
          <p className={`text-4xl font-bold capitalize ${getTierColor(user.tier)}`}>{user.tier || "Member"}</p>
          <p className="text-xs text-foreground opacity-60 mt-2">Keep earning to level up</p>
        </div>

        <div className="bg-white rounded-lg border border-accent p-6 shadow-sm">
          <p className="text-foreground opacity-60 text-sm mb-2">Next Reward</p>
          <p className="text-4xl font-bold text-primary">{Math.max(0, 100 - user.points)}</p>
          <p className="text-xs text-foreground opacity-60 mt-2">Points until next reward</p>
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
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`bg-white rounded-lg border-2 p-6 shadow-sm ${
                  coupon.used ? "border-accent opacity-50" : "border-primary"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary">{coupon.discount}% OFF</span>
                  {coupon.used && (
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">Used</span>
                  )}
                </div>
                <p className="font-mono text-lg font-bold text-foreground mb-4">{coupon.code}</p>
                <button
                  disabled={coupon.used}
                  className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {coupon.used ? "Already Used" : "Copy Code"}
                </button>
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
