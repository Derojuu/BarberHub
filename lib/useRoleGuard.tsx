"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

type Role = "admin" | "customer"

export default function useRoleGuard(role: Role, redirectTo = "/login") {
  const router = useRouter()

  useEffect(() => {
    try {
      const tokenKey = role === "admin" ? "adminToken" : "token"
      const userKey = role === "admin" ? "admin" : "user"

      const token = typeof window !== "undefined" ? localStorage.getItem(tokenKey) : null
      const userData = typeof window !== "undefined" ? localStorage.getItem(userKey) : null

      if (!token || !userData) {
        router.push(redirectTo)
        return
      }

      const user = JSON.parse(userData)
      // If user object contains a role field, validate it. If not present, assume token-less guard already caught it.
      if (user && user.role && role === "admin" && user.role !== "admin") {
        router.push(redirectTo)
      }
      if (user && user.role && role === "customer" && user.role !== "customer") {
        router.push(redirectTo)
      }
    } catch (err) {
      router.push(redirectTo)
    }
  }, [role, redirectTo, router])
}
