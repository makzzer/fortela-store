"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import QRScanner from "@/components/admin/qr-scanner"
import POSCartItem from "@/components/pos/pos-cart-item"
import { Scan, ShoppingCart, CreditCard, Trash2 } from "lucide-react"

interface POSItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
}

export default function POSPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [cart, setCart] = useState<POSItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleScan = async (code: string) => {
    setIsScanning(false)

    // In a real app, this would fetch product details from the API
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Mock product data
      const product = {
        id: code,
        name: `School Uniform Item ${code.slice(-4)}`,
        price: Math.floor(Math.random() * 50) + 10,
        size: ["S", "M", "L", "XL"][Math.floor(Math.random() * 4)],
      }

      // Add to cart or increment quantity
      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.id === product.id && item.size === product.size)

        if (existingItem) {
          return prevCart.map((item) =>
            item.id === product.id && item.size === product.size ? { ...item, quantity: item.quantity + 1 } : item,
          )
        } else {
          return [...prevCart, { ...product, quantity: 1 }]
        }
      })

      toast({
        title: "Item added",
        description: `${product.name} has been added to the cart.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add product. Please try again.",
      })
    }
  }

  const updateQuantity = (id: string, size: string | undefined, amount: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.size === size ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item,
      ),
    )
  }

  const removeItem = (id: string, size: string | undefined) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.size === size)))
  }

  const clearCart = () => {
    setCart([])
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setIsProcessing(true)

    try {
      // Simulate API call to process sale and update inventory
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Sale completed",
        description: `Successfully processed sale for ${cart.length} items.`,
      })

      clearCart()
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Checkout failed",
        description: "There was a problem processing the sale. Please try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.07 // 7% tax
  const total = subtotal + tax

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Point of Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Scan Products</CardTitle>
            </CardHeader>
            <CardContent>
              {isScanning ? (
                <div className="space-y-4">
                  <QRScanner onScan={handleScan} />
                  <Button variant="outline" onClick={() => setIsScanning(false)} className="w-full">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsScanning(true)} className="w-full" size="lg">
                  <Scan className="mr-2 h-4 w-4" /> Start Scanning
                </Button>
              )}

              {cart.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Current Cart</h3>
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <POSCartItem
                        key={`${item.id}-${item.size}-${index}`}
                        item={item}
                        onIncrement={() => updateQuantity(item.id, item.size, 1)}
                        onDecrement={() => updateQuantity(item.id, item.size, -1)}
                        onRemove={() => removeItem(item.id, item.size)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Sale Summary</span>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No items in cart</p>
                  <p className="text-sm text-muted-foreground mt-1">Scan items to add them to the sale</p>
                </div>
              ) : (
                <div>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (7%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full mb-3" size="lg" onClick={handleCheckout} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Complete Sale"}
                    {!isProcessing && <CreditCard className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
