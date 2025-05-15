"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"

interface POSItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
  stock:number
  qr_code:string
}

interface POSCartItemProps {
  item: POSItem
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

export default function POSCartItem({ item, onIncrement, onDecrement, onRemove }: POSCartItemProps) {
  return (
    <div className="flex items-center justify-between border rounded-md p-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>
        {item.size && <div className="text-xs text-muted-foreground">Size: {item.size}</div>}
        <div className="text-sm">${item.price.toFixed(2)}</div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-md">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={onDecrement}>
            <Minus className="h-3 w-3" />
          </Button>
          <div className="w-8 text-center">{item.quantity}</div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={onIncrement}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
