"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/components/store/cart-provider"
import CartItem from "@/components/store/cart-item"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingBag, ArrowRight, AlertCircle } from "lucide-react"

export default function CartPage() {
  const { cart, clearCart } = useCart()
  const { toast } = useToast()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 0 ? 5.99 : 0
  const total = subtotal + shipping

  const handleCheckout = async () => {
    setIsCheckingOut(true)
  
    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      const productos = cart.map((item) => item.id)
      const fecha = new Date().toISOString()
  
      const res = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            total,
            estado: "pendiente",
            tipo_venta: "online",
            fecha,
            fortela_productos: productos,
            fortela_cliente: 1, // ID del cliente mock, después lo reemplazás con el logueado
          },
        }),
      })
  
      if (!res.ok) throw new Error("Error al crear la orden")
  
      toast({
        title: "Orden creada correctamente",
        description: "Tu compra ha sido registrada",
      })
  
      clearCart()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al generar orden",
        description: "Ocurrió un error al finalizar la compra.",
      })
    } finally {
      setIsCheckingOut(false)
    }
  }
  

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tu Carrito</h1>

      {cart.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-6">Parece que no añadiste nada a tu carrito aún</p>
          <Button asChild>
            <Link href="/shop">Seguir comprando</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {cart.map((item) => (
                <CartItem key={`${item.id}-${item.size}`} item={item} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full mb-3" size="lg" onClick={handleCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? "Processing..." : "Checkout"}
                {!isCheckingOut && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>This is a demo checkout. No actual payment will be processed.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
