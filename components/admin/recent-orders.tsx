'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Order {
  id: number
  total: number
  date: string
  status: string
  tipo_venta: string
  documentId: string
}

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch(
        'https://vps-4937880-x.dattaweb.com/api/fortela-ordenes?populate=fortela_cliente',
        {
          cache: 'no-store',
        }
      )
      const data = await res.json()
      const formatted = data.data.map((order: any) => ({
        id: order.id,
        documentId: order.documentId,
        total: order.total,
        date: new Date(order.fecha).toLocaleDateString(),
        status: order.estado,
        tipo_venta: order.tipo_venta,
      }))
      setOrders(formatted.slice(0, 5)) // ✅ máximo 5
    }

    fetchOrders()
  }, [])

  const getBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'procesando':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      case 'pagado':
        return 'bg-green-100 text-green-800 border border-green-200'
      case 'enviado':
        return 'bg-blue-100 text-blue-800 border border-blue-200'
      case 'finalizado':
        return 'bg-gray-100 text-gray-800 border border-gray-200'
      case 'cancelado':
        return 'bg-red-100 text-red-800 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
    }
  }

  return (
    <>
      {/* 🖥️ Desktop Table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table className="min-w-[600px] text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.slice(0,6).map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.documentId}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell>${order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs px-2 py-[2px] rounded-full border ${getBadgeClass(order.status)}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View order {order.id}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 📱 Mobile Cards */}
      <div className="block sm:hidden space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded-md p-4 bg-background shadow-sm"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Order ID</span>
              <span className="text-sm font-medium">{order.documentId}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Date</span>
              <span className="text-sm">{order.date}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted-foreground">Total</span>
              <span className="text-sm">${order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Status</span>
              <span
                className={`text-xs px-2 py-[2px] rounded-full border ${getBadgeClass(order.status)}`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  )

}
