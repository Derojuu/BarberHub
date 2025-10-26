"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<"admin" | "customer" | null>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null
      const userToken = typeof window !== "undefined" ? localStorage.getItem("token") : null
      if (adminToken) setIsAuthenticated("admin")
      else if (userToken) setIsAuthenticated("customer")
      else setIsAuthenticated(null)
    } catch (e) {
      setIsAuthenticated(null)
    }
  }, [])

  function handleSignOut() {
    try {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("adminToken")
      localStorage.removeItem("admin")
    } catch (e) {
      // ignore
    }
    setIsAuthenticated(null)
    router.push("/")
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-accent shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">BH</span>
          </div>
          <span className="font-bold text-primary hidden sm:inline">BarberHub</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/services" className="text-foreground hover:text-primary transition font-medium">
            Services
          </Link>
          <Link href={isAuthenticated === "admin" ? "/admin" : "/admin/login"} className="text-foreground hover:text-primary transition font-medium">
            Admin
          </Link>
          {isAuthenticated ? (
            <button onClick={handleSignOut} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold">
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition font-semibold"
            >
              Sign In
            </Link>
          )}
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 hover:bg-accent rounded-lg transition">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-accent bg-white">
          <div className="container py-4 flex flex-col gap-4">
            <Link href="/services" className="text-foreground hover:text-primary transition font-medium">
              Services
            </Link>
            <Link href={isAuthenticated === "admin" ? "/admin" : "/admin/login"} className="text-foreground hover:text-primary transition font-medium text-center">
              Admin
            </Link>
            {isAuthenticated ? (
              <button onClick={handleSignOut} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition text-center font-semibold">
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition text-center font-semibold"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
