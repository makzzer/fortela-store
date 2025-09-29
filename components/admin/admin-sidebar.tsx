"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingBag, Package, Users, QrCode, Settings, LogOut } from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingBag,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },

  {
    title: "Stock Management",
    href: "/admin/stock",
    icon: QrCode,
  },
  {
    title: "Point of Sale",
    href: "/pos",
    icon: ShoppingBag,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex flex-col w-64 border-r bg-muted/40 min-h-screen">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span>Fortela Admin</span>
        </Link>
      </div>

      <div className="flex-1 px-4 py-2 space-y-1">
        {sidebarItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn("w-full justify-start", pathname === item.href && "bg-muted")}
            asChild
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </Link>
          </Button>
        ))}
      </div>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start" asChild>
          <Link href="/admin/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" asChild>
          <Link href="/">
            <LogOut className="mr-2 h-4 w-4" />
            Exit Admin
          </Link>
        </Button>
      </div>
    </div>
  )
}
