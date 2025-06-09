"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "./cart-provider"
import { ShoppingBag, X, Minus, Plus } from "lucide-react"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

export default function CartDropdown() {
  const [open, setOpen] = useState(false)
  const { cart, removeFromCart, updateQuantity } = useCart()

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {totalItems}
            </span>
          )}
          <span className="sr-only">Abrir carrito de compras</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="px-1">
          <SheetTitle>
            <VisuallyHidden>Carrito de compras</VisuallyHidden>
          </SheetTitle>
        </SheetHeader>

        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center space-y-2">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
            <div className="text-xl font-medium">Tu carrito está vacío</div>
            <SheetTrigger asChild>
              <Button asChild variant="link" className="text-sm text-muted-foreground">
                <Link href="/shop">Seguir comprando</Link>
              </Button>
            </SheetTrigger>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-4 py-4">
                {cart.map((item) => (
                  <div key={`${item.documentId}-${item.size ?? "default"}`} className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted relative">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium leading-tight">{item.name}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFromCart(item.documentId, item.size)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Quitar</span>
                        </Button>
                      </div>
                      {item.size && (
                        <div className="text-sm text-muted-foreground">
                          Talle: <span className="font-semibold text-foreground">{item.size}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantity(item.documentId, Math.max(1, item.quantity - 1), item.size)
                            }
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="px-2">{item.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-6 w-6"
                            onClick={() =>
                              updateQuantity(item.documentId, item.quantity + 1, item.size)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <div>Precio: ${item.price.toFixed(2)}</div>
                          <div className="font-medium">
                            Total: ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-4 px-1">
              <Separator />
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-medium">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  El envío e impuestos se calculan al finalizar la compra
                </div>
              </div>
              <SheetFooter className="flex flex-col gap-2 sm:flex-row">
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/shop">Seguir comprando</Link>
                  </Button>
                </SheetTrigger>
                <Button className="w-full" asChild onClick={() => setOpen(false)}>
                  <Link href="/cart">Finalizar compra</Link>
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
