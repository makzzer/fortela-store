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

      const data = Array(5)
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

  if (loading) return <p className="text-sm text-muted-foreground">Cargando alertas...</p>

  return (
    <div className="space-y-4">
      {alerts.map((item) => (
        <Link
          key={item.id}
          href={`/admin/products/${item.id}`}
          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted"
        >
          <div className="w-10 h-10 rounded-md overflow-hidden bg-muted relative">
            <Image
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{item.name}</h4>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {item.stock} en stock
              </Badge>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}