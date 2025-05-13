"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Minus } from "lucide-react"

interface StockUpdateFormProps {
  productId: string
}

export default function StockUpdateForm({ productId }: StockUpdateFormProps) {
  const [operation, setOperation] = useState<"add" | "remove">("add")
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulate API call to update stock
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Stock updated",
        description: `Successfully ${operation === "add" ? "added" : "removed"} ${quantity} items for product ${productId}.`,
      })

      // Reset form
      setQuantity(1)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update stock. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Operation</Label>
        <RadioGroup
          value={operation}
          onValueChange={(value) => setOperation(value as "add" | "remove")}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="add" id="add" />
            <Label htmlFor="add" className="flex items-center">
              <Plus className="mr-1 h-4 w-4" /> Add Stock
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="remove" id="remove" />
            <Label htmlFor="remove" className="flex items-center">
              <Minus className="mr-1 h-4 w-4" /> Remove Stock
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update Stock"}
      </Button>
    </form>
  )
}
