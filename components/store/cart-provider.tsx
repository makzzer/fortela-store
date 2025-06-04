"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface CartItem {
  documentId: string
  id: string
  name: string
  price: number
  image: string
  quantity: number
  size?: string
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (documentId: string, size?: string) => void
  updateQuantity: (documentId: string, quantity: number, size?: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("fortela-cart")
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("fortela-cart", JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: CartItem) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (cartItem) => cartItem.documentId === item.documentId && cartItem.size === item.size
      )
  
      if (existingItemIndex >= 0) {
        const newCart = [...prevCart]
        const existingQuantity = newCart[existingItemIndex].quantity || 0
        const incomingQuantity = item.quantity || 1
        newCart[existingItemIndex].quantity = existingQuantity + incomingQuantity
        return newCart
      } else {
        return [...prevCart, { ...item, quantity: item.quantity || 1 }]
      }
    })
  }
  
  const removeFromCart = (documentId: string, size?: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.documentId === documentId && item.size === size))
    )
  }

  const updateQuantity = (documentId: string, quantity: number, size?: string) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.documentId === documentId && item.size === size
          ? { ...item, quantity }
          : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
