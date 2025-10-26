"use client"

import Link from "next/link"
import { useState } from "react"

type HaircutCard = {
  id: number
  title: string
  description: string
  price: number
  pointValue: number
  image?: string | null
}

export default function ServiceCard({ service }: { service: HaircutCard }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const isClient = typeof window !== "undefined"
  const rawUser = isClient ? localStorage.getItem("user") : null
  const token = isClient ? localStorage.getItem("token") : null
  const loggedIn = !!rawUser && !!token

  async function handleBook() {
    if (!loggedIn) {
      // redirect to login
      window.location.href = "/login"
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ haircutId: service.id }),
      })

      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error || "Failed to create booking")
      } else {
        setMessage("Booking submitted — pending admin approval for points")
      }
    } catch (err) {
      setMessage("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-accent hover:border-primary transition p-6 shadow-sm hover:shadow-md">
      {service.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={service.image} alt={service.title} className="w-full h-40 object-cover rounded mb-4" />
      )}

      <h3 className="text-xl font-semibold text-primary mb-2">{service.title}</h3>
      <p className="text-foreground text-sm mb-4 opacity-75">{service.description}</p>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-accent">
        <div>
          <p className="text-sm text-foreground opacity-60">Earn Points</p>
          <p className="font-semibold text-primary">{service.pointValue} pts</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-primary">${service.price}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handleBook}
          disabled={loading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition text-sm font-semibold"
        >
          {loading ? "Booking..." : "Book Now"}
        </button>
      </div>

      {message && <p className="mt-3 text-sm text-foreground opacity-80">{message}</p>}
    </div>
  )
}
