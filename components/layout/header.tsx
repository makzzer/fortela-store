"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/components/store/cart-provider"
import CartDropdown from "@/components/store/cart-dropdown"
import { cn } from "@/lib/utils"
import { Menu, UserCircle } from "lucide-react"
import { useAuth } from "@/app/context/AutContext"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

const mainNavItems = [
  { name: "Home", href: "/" },
  { name: "Shop", href: "/shop" },
]

const adminNavItems = [
  { name: "Dashboard", href: "/admin" },
  { name: "Productos", href: "/admin/products" },
  { name: "Stock", href: "/admin/stock" },
  { name: "Órdenes", href: "/admin/orders" },
 //{ name: "Clientes", href: "/admin/customers" },
  { name: "POS", href: "/pos" },

]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { cart } = useCart()
  const { user, logout } = useAuth()

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const isAdminPage = pathname.startsWith("/admin") || pathname.startsWith("/pos")

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">Fortela</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
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

          {!isAdminPage && user && (
            <Link href="/admin" className="text-foreground/60 transition-colors hover:text-foreground/80">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {!isAdminPage && <CartDropdown />}

          {!user ? (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Iniciar sesión
              </Button>
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <UserCircle className="h-6 w-6 text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user.username}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Link href="/" className="flex items-center mb-6" onClick={() => setIsMenuOpen(false)}>
                <span className="font-bold text-xl">Fortela</span>
              </Link>
              <div className="flex flex-col space-y-4">
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
                {user &&
                  adminNavItems.map((item) => (
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
      </div>
    </header>
  )
}
