import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function updateLocalUserBalance(pointsBalance: number, timestamp?: number) {
  try {
    if (typeof window === "undefined") return
    const raw = localStorage.getItem("user")
    if (!raw) return
    const parsed = JSON.parse(raw)
    const existingTs = Number(parsed._pointsUpdatedAt ?? 0)
    const newTs = Number(timestamp ?? Date.now())
    // only update when new value is not older than stored one
    if (newTs < existingTs) return
    parsed.pointsBalance = Number(pointsBalance)
    parsed.points = Number(pointsBalance)
    parsed._pointsUpdatedAt = newTs
    localStorage.setItem("user", JSON.stringify(parsed))
  } catch {
    // ignore localStorage errors
  }
}
