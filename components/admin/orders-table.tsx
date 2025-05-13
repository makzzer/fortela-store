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

// This would be fetched from the API in a real app
const getOrders = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return Array(10)
    .fill(0)
    .map((_, i) => ({
      id: `ORD-${1000 + i}`,
      customer: ["John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Wilson"][i % 5],
      email: ["john@example.com", "jane@example.com", "robert@example.com", "emily@example.com", "michael@example.com"][
        i % 5
      ],
      date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
      total: Math.floor(Math.random() * 200) + 50,
      status: ["Completed", "Processing", "Shipped", "Pending", "Cancelled"][i % 5],
    }))
}

export default async function OrdersTable() {
  const orders = await getOrders()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order ID</TableHead>
          <TableHead>Customer</TableHead>
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
            <TableCell>
              <div>
                <div>{order.customer}</div>
                <div className="text-sm text-muted-foreground">{order.email}</div>
              </div>
            </TableCell>
            <TableCell>{order.date}</TableCell>
            <TableCell>${order.total.toFixed(2)}</TableCell>
            <TableCell>
              <Badge
                variant={
                  order.status === "Completed"
                    ? "default"
                    : order.status === "Processing"
                      ? "secondary"
                      : order.status === "Shipped"
                        ? "outline"
                        : order.status === "Pending"
                          ? "secondary"
                          : "destructive"
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
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" /> View Details
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
