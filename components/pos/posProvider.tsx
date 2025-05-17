// components/pos/pos-provider.tsx
"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface POSItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
  stock: number
  qr_code: string
}

interface POSContextType {
  cart: POSItem[]
  addItem: (item: POSItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
}

const POSContext = createContext<POSContextType | undefined>(undefined)

export function POSProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<POSItem[]>([])

  const addItem = (item: POSItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
      } else {
        return [...prev, { ...item, quantity: 1 }]
      }
    })
  }

  const removeItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    setCart(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => setCart([])

  return (
    <POSContext.Provider value={{ cart, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </POSContext.Provider>
  )
}

export const usePOS = () => {
  const context = useContext(POSContext)
  if (!context) throw new Error("usePOS must be used within a POSProvider")
  return context
}
