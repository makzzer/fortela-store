'use client'

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface AlertItem {
  id: string
  name: string
  stock: number
  image: string
}

export default function StockAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAlerts = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simular delay

      const data = Array(7)
        .fill(0)
        .map((_, i) => ({
          id: `${i + 1}`,
          name: `Uniforme Escolar ${i + 1}`,
          stock: Math.floor(Math.random() * 5) + 1,
          image: "/nike.jpeg",
        }))

      setAlerts(data)
      setLoading(false)
    }

    fetchAlerts()
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando alertas...</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {alerts.slice(0,6).map((item) => (
        <Link
          key={item.id}
          href={`/admin/products/${item.id}`}
          className="flex items-center gap-4 p-3 border rounded-md shadow-sm hover:bg-muted transition"
        >
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted relative">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">{item.name}</h4>
            <Badge
              variant="outline"
              className="text-xs h-5 px-2 bg-red-100 text-red-800 border-red-200 mt-1"
            >
              {item.stock} en stock
            </Badge>
          </div>
        </Link>
      ))}
    </div>
  )
}
