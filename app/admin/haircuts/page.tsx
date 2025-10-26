"use client"

import { useState } from "react"

export default function AdminHaircutsPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState(0)
  const [pointValue, setPointValue] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    if (!file) return setMessage("Please select an image")
    setLoading(true)

    try {
      const token = localStorage.getItem("adminToken")
      // Get signature + timestamp + cloudName + apiKey
      const signRes = await fetch("/api/admin/cloudinary/sign", { headers: { Authorization: `Bearer ${token}` } })
      const signData = await signRes.json()
      if (!signRes.ok) throw new Error(signData.error || "Sign failed")

      const form = new FormData()
      form.append("file", file)
      form.append("api_key", signData.apiKey)
      form.append("timestamp", String(signData.timestamp))
      form.append("signature", signData.signature)

      // Upload directly to Cloudinary
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error?.message || "Upload failed")

      // Create haircut record in our DB
      const createRes = await fetch("/api/haircuts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title,
          description,
          price,
          pointValue,
          image: uploadData.secure_url,
        }),
      })

      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || "Failed to create haircut")

      setMessage("Haircut uploaded successfully")
      setTitle("")
      setDescription("")
      setPrice(0)
      setPointValue(0)
      setFile(null)
    } catch (err: any) {
      console.error("Upload error", err)
      setMessage(err.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-12">
      <h1 className="text-2xl font-bold mb-6">Upload Haircut</h1>
      <form onSubmit={handleUpload} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Point Value</label>
            <input type="number" value={pointValue} onChange={(e) => setPointValue(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Image</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-primary text-white rounded">
            {loading ? "Uploading..." : "Upload Haircut"}
          </button>
        </div>

        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </div>
  )
}

