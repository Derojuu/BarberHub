"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import DashboardContent from "@/components/dashboard-content"
import useRoleGuard from "@/lib/useRoleGuard"

interface User {
  id: string
  username: string
  email: string
  points: number
  tier: string
}

export default function Dashboard() {
  const router = useRouter()
  useRoleGuard("customer", "/login")
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch {
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/")
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </main>
    )
  }

  if (!user) {
    return null
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />
      <section className="flex-1 py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-primary">Welcome, {user.username}!</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Logout
            </button>
          </div>
          <DashboardContent user={user} />
        </div>
      </section>
      <Footer />
    </main>
  )
}
