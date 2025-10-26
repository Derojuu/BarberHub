"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface Admin {
  id: string
  username: string
  email: string
}

interface Transaction {
  id: string
  userId: string
  userName: string
  userEmail?: string
  haircutTitle?: string
  amount: number
  points: number
  status: "pending" | "approved" | "rejected"
  createdAt: string
}

export default function AdminPanel({ admin }: { admin: Admin }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [couponCode, setCouponCode] = useState("")

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      const response = await fetch("/api/admin/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error("Failed to fetch transactions:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTransaction = async (transactionId: string) => {
    try {
      const token = localStorage.getItem("adminToken")
      // Use validate-points endpoint to ensure pointsBalance is adjusted atomically
      const res = await fetch(`/api/admin/validate-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pointsId: transactionId, status: "approved" }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to validate points")
      }
      fetchTransactions()
    } catch (err) {
      console.error("Failed to approve transaction:", err)
      alert("Failed to approve transaction")
    }
  }

  

  return (
    <div className="space-y-8">
      {/* Verify Coupon */}
      <div className="bg-light rounded-lg border border-accent p-8">
        <h2 className="text-2xl font-bold text-primary mb-6">Verify Coupon</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              const token = localStorage.getItem("adminToken")
              const res = await fetch("/api/admin/verify-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ code: couponCode }),
              })
              const data = await res.json()
              if (!res.ok) {
                alert(data.error || "Failed to verify coupon")
              } else {
                alert(`Coupon verified for ${data.updatedCoupon.user.username}`)
                setCouponCode("")
                fetchTransactions()
              }
            } catch (err) {
              console.error(err)
              alert("Failed to verify coupon")
            }
          }}
          className="space-y-4 max-w-md"
        >
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Coupon Code</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.trim().toUpperCase())}
              className="w-full px-4 py-2 border border-accent rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              placeholder="Enter coupon code to verify"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary text-light rounded-lg font-semibold hover:bg-opacity-90 transition"
          >
            Verify Coupon
          </button>
        </form>
      </div>

      {/* Pending Transactions */}
      <div>
        <h2 className="text-2xl font-bold text-primary mb-6">Pending Transactions</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading transactions...</p>
        ) : transactions.filter((t) => t.status === "pending").length === 0 ? (
          <div className="bg-light rounded-lg border border-accent p-8 text-center">
            <p className="text-muted-foreground">No pending transactions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions
              .filter((t) => t.status === "pending")
              .map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-light rounded-lg border border-accent p-6 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-foreground">{transaction.userName}</p>
                    <p className="text-sm text-muted-foreground">{transaction.userEmail}</p>
                    <p className="text-sm text-muted-foreground">
                      Service: {transaction.haircutTitle} — ${transaction.amount} → {transaction.points} points
                    </p>
                  </div>
                  <button
                    onClick={() => handleApproveTransaction(transaction.id)}
                    className="px-4 py-2 bg-primary text-light rounded-lg hover:bg-opacity-90 transition"
                  >
                    Approve
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* All Transactions */}
      <div>
        <h2 className="text-2xl font-bold text-primary mb-6">All Transactions</h2>
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : transactions.length === 0 ? (
          <div className="bg-light rounded-lg border border-accent p-8 text-center">
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent">
                  <th className="text-left py-3 px-4 font-semibold text-primary">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary">Points</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b border-accent hover:bg-background transition">
                    <td className="py-3 px-4 text-foreground">{transaction.userName}</td>
                    <td className="py-3 px-4 text-foreground">${transaction.amount}</td>
                    <td className="py-3 px-4 text-primary font-semibold">{transaction.points}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          transaction.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : transaction.status === "rejected"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
