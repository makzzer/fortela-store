'use client'

import type React from "react"
import { useEffect, Suspense, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RecentOrders from "@/components/admin/recent-orders"
import StockAlerts from "@/components/admin/stock-alerts"
import { ShoppingBag, Users, Package, DollarSign } from "lucide-react"
import { useDashboardData } from "@/components/admin/dashboard/useDashboardData"
import { Skeleton } from "@/components/ui/skeleton"
import { TabsTrigger, TabsContent, TabsList, Tabs } from "@radix-ui/react-tabs"
import SalesChart from "@/components/admin/sales-chart"
import Link from "next/link"

const STRAPI_BASE_URL = "https://vps-4937880-x.dattaweb.com"

export default function AdminDashboard() {
  const { totalSales, isLoading } = useDashboardData()

  // 👉 Estado para la card de productos
  const [totalProducts, setTotalProducts] = useState<number | null>(null)
  const [lowStockCount, setLowStockCount] = useState<number | null>(null)
  const [isProductsLoading, setIsProductsLoading] = useState<boolean>(true)

  // 👉 Estado para la card de órdenes
  const [totalOrders, setTotalOrders] = useState<number | null>(null)
  const [openOrdersCount, setOpenOrdersCount] = useState<number | null>(null)
  const [isOrdersLoading, setIsOrdersLoading] = useState<boolean>(true)

  // 👉 Fetch de productos para la card (total + low stock)
  useEffect(() => {
    const controller = new AbortController()

    const fetchProductsInfo = async () => {
      try {
        setIsProductsLoading(true)

        const res = await fetch(
          `${STRAPI_BASE_URL}/api/productos?pagination[pageSize]=1000`,
          { signal: controller.signal }
        )

        if (!res.ok) {
          console.error("Error HTTP al obtener productos:", res.status)
          setTotalProducts(0)
          setLowStockCount(0)
          return
        }

        const json = await res.json()

        const data = Array.isArray(json.data) ? json.data : []
        const total =
          json?.meta?.pagination?.total != null
            ? Number(json.meta.pagination.total)
            : data.length

        const lowStock = data.reduce((acc: number, item: any) => {
          const attrs = item.attributes ?? item
          const stock = Number(attrs.stock ?? 0)
          if (!Number.isNaN(stock) && stock < 10) {
            return acc + 1
          }
          return acc
        }, 0)

        setTotalProducts(total)
        setLowStockCount(lowStock)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.error("Error cargando info de productos:", err)
        setTotalProducts(0)
        setLowStockCount(0)
      } finally {
        setIsProductsLoading(false)
      }
    }

    fetchProductsInfo()

    return () => controller.abort()
  }, [])

  // 👉 Fetch de órdenes para la card (total + abiertas)
  useEffect(() => {
    const controller = new AbortController()

    const fetchOrdersInfo = async () => {
      try {
        setIsOrdersLoading(true)

        const res = await fetch(
          `${STRAPI_BASE_URL}/API/fortela-ordenes?pagination[pageSize]=1000`,
          { signal: controller.signal }
        )

        if (!res.ok) {
          console.error("Error HTTP al obtener órdenes:", res.status)
          setTotalOrders(0)
          setOpenOrdersCount(0)
          return
        }

        const json = await res.json()

        const data = Array.isArray(json.data) ? json.data : []
        const total =
          json?.meta?.pagination?.total != null
            ? Number(json.meta.pagination.total)
            : data.length

        const abiertas = data.reduce((acc: number, item: any) => {
          const attrs = item.attributes ?? item
          const estadoRaw = attrs.estado ?? item.estado ?? ""
          const estado =
            typeof estadoRaw === "string" ? estadoRaw.toLowerCase() : ""

          // Consideramos "pendiente" o "procesando" como órdenes abiertas
          if (estado === "procesando" || estado === "pendiente") {
            return acc + 1
          }
          return acc
        }, 0)

        setTotalOrders(total)
        setOpenOrdersCount(abiertas)
      } catch (err: any) {
        if (err?.name === "AbortError") return
        console.error("Error cargando info de órdenes:", err)
        setTotalOrders(0)
        setOpenOrdersCount(0)
      } finally {
        setIsOrdersLoading(false)
      }
    }

    fetchOrdersInfo()

    return () => controller.abort()
  }, [])

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>

      {/* ✅ Cards de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <DashboardCard
          title="Ventas Totales"
          value={isLoading ? "Cargando..." : `$${totalSales.toFixed(2)}`}
          description="In development..."
          icon={<DollarSign className="h-5 w-5" />}
          href="/admin/orders"
        />

        {/* ✅ Card de productos dinámica */}
        <DashboardCard
          title="Productos"
          value={
            isProductsLoading
              ? "Cargando..."
              : `${totalProducts ?? 0}`
          }
          description={
            isProductsLoading
              ? "Calculando stock..."
              : lowStockCount && lowStockCount > 0
              ? `${lowStockCount} con stock bajo`
              : "Sin productos con stock bajo 🎉"
          }
          href="/admin/products"
          icon={<Package className="h-5 w-5" />}
        />

        {/* ✅ Card de órdenes dinámica */}
        <DashboardCard
          title="Ordenes"
          value={
            isOrdersLoading
              ? "Cargando..."
              : `${totalOrders ?? 0}`
          }
          description={
            isOrdersLoading
              ? "Calculando órdenes..."
              : openOrdersCount && openOrdersCount > 0
              ? `${openOrdersCount} en proceso`
              : "Sin órdenes pendientes 🎉"
          }
          href="/admin/orders"
          icon={<ShoppingBag className="h-5 w-5" />}
        />

        {/* Por ahora Clients sigue como placeholder */}
        <DashboardCard
          title="Clientes"
          value="1500"
          description="Proximamente..."
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Alertas de Stock</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Suspense fallback={<StockAlertsSkeleton />}>
            <StockAlerts />
          </Suspense>
        </CardContent>
      </Card>

      <Card className="mt-4 sm:mt-6">
        <CardHeader>
          <CardTitle>Órdenes Recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Suspense fallback={<RecentOrdersSkeleton />}>
            <RecentOrders />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

function DashboardCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  href?: string
}) {
  const content = (
    <CardContent className="p-4 sm:p-6 cursor-pointer">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className="min-w-[36px] min-h-[36px] bg-primary/10 p-2 rounded-full text-primary flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-xl sm:text-2xl font-bold mb-1 break-words">
        {value}
      </div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </CardContent>
  )

  return (
    <Card className="w-full max-w-full transition hover:shadow-md">
      {href ? (
        <Link href={href} className="block">
          {content}
        </Link>
      ) : (
        content
      )}
    </Card>
  )
}

function StockAlertsSkeleton() {
  return (
    <div className="space-y-4">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
    </div>
  )
}

function RecentOrdersSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
    </div>
  )
}
