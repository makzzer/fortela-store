import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, MoreHorizontal, Mail, ShoppingBag } from "lucide-react"

// This would be fetched from the API in a real app
const getCustomers = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return Array(10)
    .fill(0)
    .map((_, i) => ({
      id: `${1000 + i}`,
      name: ["John Doe", "Jane Smith", "Robert Johnson", "Emily Davis", "Michael Wilson"][i % 5],
      email: ["john@example.com", "jane@example.com", "robert@example.com", "emily@example.com", "michael@example.com"][
        i % 5
      ],
      orders: Math.floor(Math.random() * 10) + 1,
      spent: Math.floor(Math.random() * 1000) + 100,
      lastOrder: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toLocaleDateString(),
    }))
}

export default async function CustomersTable() {
  const customers = await getCustomers()

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Orders</TableHead>
          <TableHead>Total Spent</TableHead>
          <TableHead>Last Order</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell>
              <div>
                <div className="font-medium">{customer.name}</div>
                <div className="text-sm text-muted-foreground">{customer.email}</div>
              </div>
            </TableCell>
            <TableCell>{customer.orders}</TableCell>
            <TableCell>${customer.spent.toFixed(2)}</TableCell>
            <TableCell>{customer.lastOrder}</TableCell>
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
                    <ShoppingBag className="mr-2 h-4 w-4" /> View Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Mail className="mr-2 h-4 w-4" /> Send Email
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
