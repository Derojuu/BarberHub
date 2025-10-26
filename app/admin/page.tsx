"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import AdminPanel from "@/components/admin-panel"
import useRoleGuard from "@/lib/useRoleGuard"

interface Admin {
  id: string
  username: string
  email: string
}

export default function AdminDashboard() {
  const router = useRouter()
  useRoleGuard("admin", "/admin/login")
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const adminData = localStorage.getItem("admin")
    try {
      if (adminData) setAdmin(JSON.parse(adminData))
    } catch {
      /* ignore parse errors - guard already handles redirects */
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("admin")
    router.push("/admin/login")
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

  if (!admin) {
    return null
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />
      <section className="flex-1 py-16 bg-background">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-primary">Admin Dashboard</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/haircuts")}
                className="px-4 py-2 bg-primary text-light rounded-lg hover:bg-opacity-90 transition"
              >
                Manage Haircuts
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-light transition"
              >
                Logout
              </button>
            </div>
          </div>
          <AdminPanel admin={admin} />
        </div>
      </section>
      <Footer />
    </main>
  )
}
