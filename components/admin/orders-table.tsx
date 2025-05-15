

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, MoreHorizontal, Truck, XCircle } from "lucide-react"
import OrderDetailsModal from "./OrderDetailsModal"

const getOrders = async () => {
  const res = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes", {
    cache: "no-store",
  })
  const data = await res.json()

  return data.data.map((order: any) => ({
    id: order.id,
    total: order.total,
    date: new Date(order.fecha).toLocaleDateString(),
    status: order.estado,
    tipo_venta: order.tipo_venta,
  }))
}

export default async function OrdersTable() {
  const orders = await getOrders()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order: any) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">ORD-{order.id}</TableCell>
            <TableCell>{order.date}</TableCell>
            <TableCell>${order.total.toFixed(2)}</TableCell>
            <TableCell>
              <Badge variant="secondary">{order.tipo_venta}</Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  order.status === "completado"
                    ? "default"
                    : order.status === "pendiente"
                    ? "secondary"
                    : order.status === "cancelado"
                    ? "destructive"
                    : "outline"
                }
              >
                {order.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <OrderDetailsModal order={order}>
                      <div className="flex items-center">
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </div>
                    </OrderDetailsModal>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Truck className="mr-2 h-4 w-4" /> Update Status
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
