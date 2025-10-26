"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect root to customer login
export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push("/login")
  }, [router])

  return null
}
