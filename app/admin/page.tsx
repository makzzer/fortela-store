'use client'

import type React from "react"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import RecentOrders from "@/components/admin/recent-orders"
import SalesChart from "@/components/admin/sales-chart"
import StockAlerts from "@/components/admin/stock-alerts"
import { ShoppingBag, Users, Package, DollarSign } from "lucide-react"
import { useDashboardData } from "@/components/admin/dashboard/useDashboardData"

export default function AdminDashboard() {
  const { totalSales, isLoading } = useDashboardData()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Sales"
          value={isLoading ? "Cargando..." : `$${totalSales.toFixed(2)}`}
          description="En construcción..."
          icon={<DollarSign className="h-5 w-5" />}
        />
        <DashboardCard title="Orders" value="156" description="24 pending" icon={<ShoppingBag className="h-5 w-5" />} />
        <DashboardCard title="Products" value="87" description="12 low stock" icon={<Package className="h-5 w-5" />} />
        <DashboardCard
          title="Customers"
          value="1,245"
          description="+18 this week"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<Skeleton className="h-80 w-full" />}>
                  <SalesChart />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {/* ✅ Eliminado Suspense */}
                <StockAlerts />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Detailed analytics content would go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Reports and exports would go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
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
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground">{title}</span>
          <div className="bg-primary/10 p-2 rounded-full text-primary">{icon}</div>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </CardContent>
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