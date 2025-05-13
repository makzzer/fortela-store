import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

// This would be fetched from the API in a real app
const getRecentOrders = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return Array(5)
    .fill(0)
    .map((_, i) => ({
      id: `ORD-${1000 + i}`,
      customer: ["John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Wilson"][i],
      date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
      total: Math.floor(Math.random() * 200) + 50,
      status: ["Completed", "Processing", "Shipped", "Pending", "Cancelled"][i],
    }))
}

export default async function RecentOrders() {
  const orders = await getRecentOrders()

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
            <TableCell>{order.customer}</TableCell>
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
