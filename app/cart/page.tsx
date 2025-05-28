"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/components/store/cart-provider"
import CartItem from "@/components/store/cart-item"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingBag, ArrowRight, AlertCircle } from "lucide-react"
import { useItemOrden } from "../context/ItemOrdenContext"

export default function CartPage() {
  const { cart, clearCart } = useCart()
  const { toast } = useToast()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const { setOrden } = useItemOrden()

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 0 ? 5.99 : 0
  const total = subtotal + shipping

  const handleCheckout = async () => {
    setIsCheckingOut(true)

    try {
      const fecha = new Date().toISOString()

      // 1. Crear la orden
      const res = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            total,
            estado: "pendiente",
            tipo_venta: "online",
            fecha,
            fortela_cliente: 1,
          },
        }),
      })

      if (!res.ok) throw new Error("Error al crear la orden")

      const ordenData = await res.json()
      const ordenId = ordenData.data.id

      const items: any[] = []

      // 2. Crear los items comprados relacionados a la orden
      for (const item of cart) {
        const productRes = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}`)
        const productData = await productRes.json()
        const productoId = productData?.data?.[0]?.id

        if (!productoId) {
          console.error(`No se encontró producto con documentId: ${item.documentId}`)
          continue
        }

        const itemRes = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados?populate=*", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              cantidad: item.quantity,
              fortela_producto: productoId,
              fortela_orden: ordenId,
            },
          }),
        })

        if (itemRes.ok) {
          items.push({
            id: 0,
            cantidad: item.quantity,
            producto: {
              id: productoId,
              nombre: item.name,
              precio: item.price,
              descripcion: "-",
              talle: item.size,
            },
          })
        }
      }

      // 3. Actualizar el stock
      for (const item of cart) {
        const getRes = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${item.documentId}`)
        const data = await getRes.json()
        const currentStock = data?.data?.stock

        if (typeof currentStock === "number") {
          const newStock = currentStock - item.quantity
          await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${item.documentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: {
                stock: newStock >= 0 ? newStock : 0,
              },
            }),
          })
        }
      }

      // 4. Guardar en el context
      setOrden({
        id: ordenId,
        estado: "pendiente",
        total,
        fecha,
        tipo_venta: "online",
        items,
      })

      toast({
        title: "Orden creada correctamente",
        description: "Tu compra ha sido registrada y el stock actualizado.",
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
                <CartItem key={`${item.documentId}-${item.size ?? ""}`} item={item} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Resumen de compra</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envío</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Button className="w-full mb-3" size="lg" onClick={handleCheckout} disabled={isCheckingOut}>
                {isCheckingOut ? "Procesando..." : "Finalizar compra"}
                {!isCheckingOut && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>Este es un checkout de prueba. No se realizará ningún pago real.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
