"use client"

import { useState } from "react"
import Swal from "sweetalert2"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/components/store/cart-provider"
import { ShoppingCart } from "lucide-react"

interface Product {
  id: number
  documentId: string
  name: string
  price: number
  image: string
  size?: string
  sizes?: string[]
  variantesPorTalle?: { talle: string; precio: number; cantidad: number }[]
}

interface AddToCartButtonProps {
  product: Product
  showSelect?: boolean
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)

  const getPriceBySize = (talle: string): number => {
    const variante = product.variantesPorTalle?.find((v) => v.talle === talle)
    return variante?.precio ?? product.price
  }

  const getStockDisponible = (talle: string): number => {
    const variante = product.variantesPorTalle?.find((v) => v.talle === talle)
    return variante?.cantidad ?? 0
  }

  const handleAddToCart = () => {
    if (!product.size) {
      toast({
        variant: "destructive",
        title: "Seleccioná un talle",
        description: "Tenés que seleccionar un talle antes de agregar el producto al carrito.",
      })
      return
    }

    const stockDisponible = getStockDisponible(product.size)

    if (quantity > stockDisponible) {
      Swal.fire({
        icon: "warning",
        title: "Stock insuficiente",
        text: `Solo hay ${stockDisponible} unidad${stockDisponible === 1 ? "" : "es"} disponibles del talle ${product.size}.`,
        confirmButtonText: "Entendido",
      })
      return
    }

    const price = getPriceBySize(product.size)

    setIsAdding(true)

    setTimeout(() => {
      addToCart({
        id: String(product.id),
        documentId: product.documentId,
        name: product.name,
        price: price,
        image: product.image,
        quantity: quantity,
        size: product.size,
        stockDisponible: stockDisponible,
      })

      toast({
        title: "Producto agregado",
        description: `${product.name} (Talle ${product.size}) x${quantity} fue agregado al carrito.`,
      })

      setIsAdding(false)
    }, 300)
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Cantidad:</label>
        <Input
          type="number"
          min={1}
          max={getStockDisponible(product.size || "")}
          value={quantity}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1
            setQuantity(Math.min(value, getStockDisponible(product.size || "")))
          }}
          className="w-20 h-8 text-sm"
        />
      </div>
      <Button className="w-full" onClick={handleAddToCart} disabled={isAdding}>
        {isAdding ? "Agregando..." : "Agregar al carrito"}
        {!isAdding && <ShoppingCart className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  )
}
