"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/components/store/cart-provider"
import CartDropdown from "@/components/store/cart-dropdown"
import { cn } from "@/lib/utils"
import { Menu } from "lucide-react"

const mainNavItems = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
  //{ name: "About", href: "/about" },
  //{ name: "Contact", href: "/contact" },
]

const adminNavItems = [
  { name: "Dashboard", href: "/admin" },
  { name: "Productos", href: "/admin/products" },
  { name: "Órdenes", href: "/admin/orders" },
  { name: "Clientes", href: "/admin/customers" },
  { name: "POS", href: "/pos" },
]


export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { cart } = useCart()

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const isAdminPage = pathname.startsWith("/admin") || pathname.startsWith("/pos")

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="font-bold text-xl">Fortela</span>
        </Link>

        <div className="hidden md:flex md:flex-1">
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href ? "text-foreground" : "text-foreground/60",
                )}
              >
                {item.name}
              </Link>
            ))}

            {!isAdminPage && (
              <Link href="/admin" className="text-foreground/60 transition-colors hover:text-foreground/80">
                Admin
              </Link>
            )}
          </nav>
        </div>

        {!isAdminPage && (
          <div className="flex items-center">
            <CartDropdown />
          </div>
        )}

        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <Link href="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
              <span className="font-bold text-xl">Fortela</span>
            </Link>
            <div className="mt-8 flex flex-col space-y-4">
              {mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-foreground/60 transition-colors hover:text-foreground",
                    pathname === item.href && "text-foreground",
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="h-px bg-border my-2" />
              {adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground/60 transition-colors hover:text-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
