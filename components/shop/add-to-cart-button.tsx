"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/components/store/cart-provider"
import { ShoppingCart } from "lucide-react"

interface Product {
  id: string
  name: string
  price: number
  image: string
  sizes?: string[]
}

interface AddToCartButtonProps {
  product: Product
  showSelect?: boolean
}

export default function AddToCartButton({ product, showSelect = true }: AddToCartButtonProps) {
  const [size, setSize] = useState(product.sizes?.[0] || "")
  const [isAdding, setIsAdding] = useState(false)
  const { addToCart } = useCart()
  const { toast } = useToast()

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !size) {
      toast({
        variant: "destructive",
        title: "Please select a size",
        description: "You need to select a size before adding to cart.",
      })
      return
    }

    setIsAdding(true)

    // Simulate a delay for better UX
    setTimeout(() => {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        size: size || undefined,
      })

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      })

      setIsAdding(false)
    }, 500)
  }

  return (
    <div className="w-full space-y-3">
      {showSelect && product.sizes && product.sizes.length > 0 && (
        <Select value={size} onValueChange={setSize}>
          <SelectTrigger>
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {product.sizes.map((size) => (
              <SelectItem key={size} value={size}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button className="w-full" onClick={handleAddToCart} disabled={isAdding}>
        {isAdding ? "Adding..." : "Add to Cart"}
        {!isAdding && <ShoppingCart className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  )
}
