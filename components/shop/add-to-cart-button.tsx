"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
}

interface AddToCartButtonProps {
  product: Product
  showSelect?: boolean // ya no se usa porque se pasa false desde el catálogo
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addToCart } = useCart()
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = () => {
    if (!product.size) {
      toast({
        variant: "destructive",
        title: "Seleccioná un talle",
        description: "Tenés que seleccionar un talle antes de agregar el producto al carrito.",
      })
      return
    }

    setIsAdding(true)

    setTimeout(() => {
      addToCart({
        id: String(product.id),
        documentId: product.documentId,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        size: product.size,
      })

      toast({
        title: "Producto agregado",
        description: `${product.name} (Talle ${product.size}) fue agregado al carrito.`,
      })

      setIsAdding(false)
    }, 300)
  }

  return (
    <div className="w-full">
      <Button className="w-full" onClick={handleAddToCart} disabled={isAdding}>
        {isAdding ? "Agregando..." : "Agregar al carrito"}
        {!isAdding && <ShoppingCart className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  )
}
