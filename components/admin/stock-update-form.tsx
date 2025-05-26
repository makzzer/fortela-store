"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Minus } from "lucide-react"

interface StockUpdateFormProps {
  productId: string // documentId
}

export default function StockUpdateForm({ productId }: StockUpdateFormProps) {
  const [operation, setOperation] = useState<"add" | "remove">("add")
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [producto, setProducto] = useState<any>(null)
  const { toast } = useToast()

  // Fetch product by documentId
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${productId}`)
        const data = await res.json()
        const productoData = data?.data?.[0]
        if (productoData) setProducto(productoData)
        else throw new Error("Producto no encontrado")
      } catch (error) {
        console.error(error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo cargar el producto escaneado.",
        })
      }
    }

    if (productId) fetchProduct()
  }, [productId, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!producto) return

    const currentStock = producto.stock || 0
    const newStock = operation === "add"
      ? currentStock + quantity
      : Math.max(0, currentStock - quantity)

    setIsSubmitting(true)

    try {
      const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${producto.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data: { stock: newStock } }),
      })

      if (!res.ok) throw new Error("Error actualizando el stock")

      toast({
        title: "Stock actualizado",
        description: `Nuevo stock para ${producto.nombre}: ${newStock}`,
      })

      // actualizar estado local para reflejar cambio inmediato
      setProducto((prev: any) => ({
        ...prev,
        stock: newStock,
      }))

      setQuantity(1)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el stock.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!producto) return <p className="text-muted-foreground text-sm">Cargando producto...</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm">
        <p><span className="font-semibold">Producto:</span> {producto.nombre}</p>
        <p><span className="font-semibold">Stock actual:</span> {producto.stock}</p>
      </div>

      <div className="space-y-2">
        <Label>Operación</Label>
        <RadioGroup
          value={operation}
          onValueChange={(value) => setOperation(value as "add" | "remove")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="add" id="add" />
            <Label htmlFor="add" className="flex items-center cursor-pointer">
              <Plus className="mr-1 h-4 w-4" /> Sumar stock
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="remove" id="remove" />
            <Label htmlFor="remove" className="flex items-center cursor-pointer">
              <Minus className="mr-1 h-4 w-4" /> Restar stock
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Cantidad</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Actualizando..." : "Actualizar stock"}
      </Button>
    </form>
  )
}
