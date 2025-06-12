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
      setOrders(formatted.slice(0, 6)) // máximo 6
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
    <Table>
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
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id}</TableCell>
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
  )
}
