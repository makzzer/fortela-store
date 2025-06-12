"use client"

import { useState } from "react"
import Link from "next/link"
import { useCart } from "@/components/store/cart-provider"
import CartItem from "@/components/store/cart-item"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { ShoppingBag, ArrowRight, AlertCircle } from "lucide-react"
import Swal from "sweetalert2"

export default function CartPage() {
  const { cart, clearCart } = useCart()
  const { toast } = useToast()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const subtotal = cart.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 0 ? 5.99 : 0
  const total = subtotal + shipping

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    try {
      for (const item of cart) {
        const res = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}&populate=*`
        )
        const data = await res.json()
        const producto = data.data?.[0]

        if (!producto) {
          throw new Error(`Producto no encontrado: ${item.documentId}`)
        }

        const variante = producto.variantesPorTalle?.find((v: any) => v.talle === item.size)
        const stockDisponible = variante?.cantidad ?? 0

        if (item.quantity > stockDisponible) {
          Swal.fire({
            icon: "error",
            title: "Stock insuficiente",
            text: `El producto ${item.name} (Talle ${item.size}) tiene solo ${stockDisponible} unidad(es) disponibles.`,
            confirmButtonText: "Aceptar",
          })
          setIsCheckingOut(false)
          return
        }
      }

      const fecha = new Date().toISOString()
      const ordenPayload = {
        data: {
          total,
          estado: "procesando",
          tipo_venta: "online",
          fecha,
          fortela_cliente: 2,
        },
      }

      const ordenRes = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenPayload),
      })

      const ordenJson = await ordenRes.json()
      if (!ordenRes.ok) throw new Error("Error al crear la orden")

      const ordenId: number = ordenJson.data.id

      for (const item of cart) {
        const productoRes = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}&populate=*`
        )
        const productoJson = await productoRes.json()
        const producto = productoJson?.data?.[0]
        const productoId = producto.id

        const itemPayload = {
          data: {
            cantidad: item.quantity,
            fortela_producto: productoId,
            fortela_orden: ordenId,
            talle: item.size,
          },
        }

        await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemPayload),
        })

        const nuevasVariantes = producto.variantesPorTalle.map((v: any) => ({
          talle: v.talle,
          cantidad: v.talle === item.size ? Math.max(0, v.cantidad - item.quantity) : v.cantidad,
          precio: v.precio,
        }))

        const nuevoStockTotal = nuevasVariantes.reduce((sum: number, v: any) => sum + v.cantidad, 0)

        await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${item.documentId}?populate=*`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              variantesPorTalle: nuevasVariantes,
              stock: nuevoStockTotal,
            },
          }),
        })
      }

      toast({
        title: "Orden creada correctamente",
        description: "Tu compra ha sido registrada y el stock actualizado.",
      })

      clearCart()
    } catch (error) {
      console.error("❌ Checkout error:", error)
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
              {cart.map((item: any) => (
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