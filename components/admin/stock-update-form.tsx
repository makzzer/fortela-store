"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Swal from "sweetalert2"

interface StockUpdateFormProps {
  productId: string // documentId
}

export default function StockUpdateForm({ productId }: StockUpdateFormProps) {
  const [operation, setOperation] = useState<"add" | "remove">("add")
  const [quantity, setQuantity] = useState<number | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [producto, setProducto] = useState<{
    id: number
    documentId: string
    nombre: string
    stock: number
  } | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${productId}`
        )
        const data = await res.json()
        const productoData = data?.data?.[0]

        if (!productoData)
          throw new Error("Producto no encontrado")

        setProducto({
          id: productoData.id,
          documentId: productoData.documentId,
          nombre: productoData.nombre || "Sin nombre",
          stock: productoData.stock || 0,
        })
      } catch (error) {
        console.error(error)
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar el producto escaneado.",
        })
      }
    }

    if (productId) fetchProduct()
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!producto || quantity === "") return

    setIsSubmitting(true)

    try {
      // Obtener el producto actualizado antes de hacer el PUT
      const getRes = await fetch(
        `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${producto.documentId}`
      )
      const getData = await getRes.json()
      const fetchedProduct = getData?.data?.[0]

      if (!fetchedProduct) throw new Error("Producto no encontrado al actualizar stock")

      const stockActual = fetchedProduct.stock
      const idNumerico = fetchedProduct.documentId

      const newStock =
        operation === "add"
          ? stockActual + quantity
          : Math.max(0, stockActual - quantity)

      const putRes = await fetch(
        `https://vps-4937880-x.dattaweb.com/api/productos/${idNumerico}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: {
              stock: newStock,
            },
          }),
        }
      )

      if (!putRes.ok) throw new Error("Error actualizando el stock")

      await Swal.fire({
        icon: "success",
        title: "Stock actualizado",
        text: `Nuevo stock para ${fetchedProduct.nombre}: ${newStock}`,
        confirmButtonText: "OK",
      })

      setProducto({
        ...producto,
        stock: newStock,
      })
      setQuantity("")
    } catch (error) {
      console.error(error)
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el stock.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!producto)
    return <p className="text-muted-foreground text-sm">Cargando producto...</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm">
        <p>
          <span className="font-semibold">Producto:</span> {producto.nombre}
        </p>
        <p>
          <span className="font-semibold">Stock actual:</span> {producto.stock}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Elegí operación</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={operation === "add" ? "default" : "outline"}
            onClick={() => setOperation("add")}
            className="flex-1"
          >
            + Sumar stock
          </Button>
          <Button
            type="button"
            variant={operation === "remove" ? "default" : "outline"}
            onClick={() => setOperation("remove")}
            className="flex-1"
          >
            – Restar stock
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Cantidad</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) =>
            setQuantity(e.target.value === "" ? "" : parseInt(e.target.value))
          }
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting || quantity === ""}>
        {isSubmitting ? "Actualizando..." : "Actualizar stock"}
      </Button>
    </form>
  )
}
