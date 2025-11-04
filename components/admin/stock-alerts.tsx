"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface AlertItem {
  id: string          // usamos documentId para el link
  name: string
  stock: number
}

const STRAPI_BASE_URL = "https://vps-4937880-x.dattaweb.com"

export default function StockAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    const fetchAlerts = async () => {
      try {
        setLoading(true)

        const res = await fetch(
          `${STRAPI_BASE_URL}/api/productos?populate=*`,
          { signal: controller.signal }
        )

        if (!res.ok) {
          console.error("Error HTTP al obtener productos:", res.status)
          setAlerts([])
          return
        }

        const json = await res.json()
        const raw = Array.isArray(json.data) ? json.data : []

        const mapped: AlertItem[] = raw
          .map((item: any) => {
            const attrs = item.attributes ?? item

            // ID para el link: documentId si existe, sino id numérico
            const id =
              (attrs.documentId as string | undefined) ??
              String(item.id ?? "")

            // Nombre
            const name = (attrs.nombre as string) ?? "Producto sin nombre"

            // Stock general
            const stock = Number(attrs.stock ?? 0)

            return { id, name, stock }
          })
          // solo stock menor a 10
          .filter((p:any) => !Number.isNaN(p.stock) && p.stock < 10)
          // primero los más críticos
          .sort((a:any, b:any) => a.stock - b.stock)
          // solo 6
          .slice(0, 6)

        setAlerts(mapped)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.error("Error cargando alertas de stock:", err)
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()

    return () => controller.abort()
  }, [])

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando alertas...</p>
  }

  if (!alerts.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay productos con stock menor a 10 en este momento 🎉
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {alerts.map((item) => (
        <Link
          key={item.id}
          href={`/admin/products/${item.id}`}
          className="flex items-center gap-4 p-3 border rounded-md shadow-sm hover:bg-muted transition"
        >
          {/* ✅ Imagen genérica fija, como antes */}
          <div className="w-12 h-12 rounded-md overflow-hidden bg-muted relative">
            <Image
              src="/nike.jpeg"
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
