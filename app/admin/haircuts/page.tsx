"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

export default function AdminHaircutsPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  // use string states for numeric fields so input doesn't start as "0"
  const [priceStr, setPriceStr] = useState("")
  const [pointValueStr, setPointValueStr] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const fr = new FileReader()
    fr.onload = () => setPreview(String(fr.result))
    fr.readAsDataURL(file)
    return () => fr.abort && fr.abort()
  }, [file])

  // simple numeric input sanitizer: allow digits and optional decimal point
  const onNumberChange = (val: string, setter: (s: string) => void) => {
    // allow empty
    if (val === "") return setter("")
    // allow only numbers and single dot
    const sanitized = val.replace(/[^\d.]/g, "")
    const parts = sanitized.split(".")
    if (parts.length <= 2) {
      // remove leading zeros unless decimal
      const [intPart, decPart] = parts
      const cleanInt = intPart.replace(/^0+(?=\d)/, "")
      setter(decPart !== undefined ? `${cleanInt}.${decPart}` : cleanInt)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (!title.trim()) return toast.error("Title is required")
      if (!description.trim()) return toast.error("Description is required")
      if (!file) return toast.error("Please select an image")
      // parse numbers safely
      const price = priceStr === "" ? 0 : Number(priceStr)
      const pointValue = pointValueStr === "" ? 0 : Number(pointValueStr)
      if (Number.isNaN(price) || Number.isNaN(pointValue)) return toast.error("Invalid numeric values")

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
          title: title.trim(),
          description: description.trim(),
          price,
          pointValue,
          image: uploadData.secure_url,
        }),
      })

      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || "Failed to create haircut")

      toast.success("Haircut uploaded successfully")
      // reset form
      setTitle("")
      setDescription("")
      setPriceStr("")
      setPointValueStr("")
      setFile(null)
      setPreview(null)
    } catch (err: any) {
      console.error("Upload error", err)
      toast.error(err?.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-extrabold mb-6">Create Haircut</h1>

      <form onSubmit={handleUpload} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. Classic Cut"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            rows={4}
            placeholder="Short description shown on services page"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Price (NGN)</label>
            <input
              inputMode="decimal"
              value={priceStr}
              onChange={(e) => onNumberChange(e.target.value, setPriceStr)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Point Value</label>
            <input
              inputMode="numeric"
              value={pointValueStr}
              onChange={(e) => onNumberChange(e.target.value, setPointValueStr)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g. 10"
              min="0"
              step="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Image</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-50 border rounded">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <span className="text-sm text-gray-700">Choose image</span>
            </label>

            {preview ? (
              <div className="relative">
                <img src={preview} alt="preview" className="w-28 h-20 object-cover rounded border" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                  }}
                  className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs flex items-center justify-center"
                  aria-label="remove image"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No image selected</div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary text-white rounded font-semibold hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Upload Haircut"}
          </button>

          <button
            type="button"
            onClick={() => {
              setTitle("")
              setDescription("")
              setPriceStr("")
              setPointValueStr("")
              setFile(null)
              setPreview(null)
            }}
            className="px-4 py-2 border rounded text-sm"
          >
            Reset
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Image will be uploaded to Cloudinary. Price and point values must be numbers. Use the reset button to clear the form.
        </p>
      </form>
    </div>
  )
}

