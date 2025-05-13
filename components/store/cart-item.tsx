"use client"

import type React from "react"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCart, type CartItem as CartItemType } from "./cart-provider"
import { Trash2, Plus, Minus } from "lucide-react"

interface CartItemProps {
  item: CartItemType
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart()

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      updateQuantity(item.id, value, item.size)
    }
  }

  const incrementQuantity = () => {
    updateQuantity(item.id, item.quantity + 1, item.size)
  }

  const decrementQuantity = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1, item.size)
    }
  }

  return (
    <div className="flex items-start gap-4 border rounded-lg p-4">
      <div className="w-24 h-24 rounded-md overflow-hidden bg-muted relative shrink-0">
        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
      </div>

      <div className="flex-1 space-y-1">
        <h3 className="font-medium">{item.name}</h3>
        {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
        <p className="font-medium">${item.price.toFixed(2)}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-r-none" onClick={decrementQuantity}>
            <Minus className="h-3 w-3" />
            <span className="sr-only">Decrease quantity</span>
          </Button>
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={handleQuantityChange}
            className="h-8 w-12 rounded-none border-x-0 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-l-none" onClick={incrementQuantity}>
            <Plus className="h-3 w-3" />
            <span className="sr-only">Increase quantity</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={() => removeFromCart(item.id, item.size)}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
    </div>
  )
}
