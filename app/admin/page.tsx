'use client'

import type React from "react"
import { useEffect, Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import RecentOrders from "@/components/admin/recent-orders"
import StockAlerts from "@/components/admin/stock-alerts"
import { ShoppingBag, Users, Package, DollarSign } from "lucide-react"
import { useDashboardData } from "@/components/admin/dashboard/useDashboardData"
import { Skeleton } from "@/components/ui/skeleton"
import { TabsTrigger, TabsContent, TabsList, Tabs } from "@radix-ui/react-tabs"
import SalesChart from "@/components/admin/sales-chart"
import Link from "next/link"

export default function AdminDashboard() {
  const { totalSales, isLoading } = useDashboardData()

  // CSS helper para eliminar scroll horizontal
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .no-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
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
          href="/admin/orders" // ✅ Aquí agregás el link
        />

        <DashboardCard title="Productos" value="87" description="12 low stock" href="/admin/products" icon={<Package className="h-5 w-5" />} />

        <DashboardCard title="Ordenes" value="156" description="24 pendientes" href="/admin/orders" icon={<ShoppingBag className="h-5 w-5" />} />


        <DashboardCard
          title="Clientes"
          value="1500"
          //description="+18 this week"
          description="In Development.."
          icon={<Users className="h-5 w-5" />}
        />
 
      </div>


      {/*
      <Tabs defaultValue="overview" className="mb-8 w-full">
        <TabsList className="flex w-full overflow-x-auto whitespace-nowrap rounded-md border p-1 no-scrollbar">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <Suspense fallback={<Skeleton className="h-80 w-full" />}>
                  <SalesChart />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <StockAlerts />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <p>Detailed analytics content would go here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <p>Reports and exports would go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

  */}



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
      <div className="text-xl sm:text-2xl font-bold mb-1 break-words">{value}</div>
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
