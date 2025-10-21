// components/pos/pos-provider.tsx
"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

export interface VarianteTalle {
  talle: string
  cantidad: number
  precio?: number
}
export interface ColegioBlock {
  colegio: string
  variantesPorTalles: VarianteTalle[]
}

export interface POSItem {
  id: string
  idStrapiProducto?: number   // ⬅️ NUEVO: id numérico real de Strapi
  name: string
  price: number
  quantity: number
  stock: number
  qr_code: string
  colegio?: string
  size?: string
  variantes?: VarianteTalle[]
  variantesPorColegio?: ColegioBlock[]
  pendingSelection?: boolean
}


type POSContextType = {
  cart: POSItem[]
  addItem: (item: POSItem) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void

  // NUEVO
  setItemColegio: (key: string, colegio: string) => void
  setItemSize: (key: string, size: string) => void
  increment: (key: string) => void
  decrement: (key: string) => void
}

const POSContext = createContext<POSContextType | undefined>(undefined)

// helper: clave única por producto+colegio+talle
const keyFor = (i: POSItem) =>
  [i.id, i.colegio ?? "-", i.size ?? "-"].join("|")

// busca la variante (precio/stock) según selección
function findSelectedVariant(item: POSItem): VarianteTalle | undefined {
  if (item.colegio && item.variantesPorColegio?.length) {
    const block = item.variantesPorColegio.find(c => c.colegio === item.colegio)
    return block?.variantesPorTalles.find(v => v.talle === item.size)
  }
  if (item.variantes?.length) {
    return item.variantes.find(v => v.talle === item.size)
  }
  return undefined
}

export function POSProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<POSItem[]>([])

  const addItem = (item: POSItem) => {
    // Si el producto tiene colegios/talles, entra pendiente hasta elegir
    const needsSelection =
      (item.variantesPorColegio?.length ?? 0) > 0 ||
      (item.variantes?.length ?? 0) > 0

    const base: POSItem = {
      ...item,
      pendingSelection: needsSelection,
    }

    // mientras no se eligió colegio+size, la clave es solo por productId (para no duplicar)
    const tmpKey = base.id + "|-|-" // clave temporal
    setCart(prev => {
      // si ya hay un "pendiente" del mismo productId, sumo cantidad
      const idx = prev.findIndex(it => keyFor(it) === tmpKey || it.id === base.id && it.pendingSelection)
      if (idx >= 0) {
        const copy = [...prev]
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 }
        return copy
      }
      return [...prev, { ...base, quantity: 1 }]
    })
  }

  const removeItem = (key: string) => {
    setCart(prev => prev.filter(i => keyFor(i) !== key && (i.id + "|-|-") !== key))
  }

  const updateQuantity = (key: string, quantity: number) => {
    setCart(prev => prev.map(i => {
      const match = keyFor(i) === key || (i.id + "|-|-") === key
      return match ? { ...i, quantity: Math.max(1, quantity) } : i
    }))
  }

  const clearCart = () => setCart([])

  const setItemColegio = (key: string, colegio: string) => {
    setCart(prev => prev.map(i => {
      const match = keyFor(i) === key || (i.id + "|-|-") === key
      if (!match) return i
      // al elegir colegio, reseteo talle
      const updated: POSItem = { ...i, colegio, size: undefined }
      // recalculo clave (pero en el state guardamos array; la clave se usa por el caller)
      return updated
    }))
  }

  const setItemSize = (key: string, size: string) => {
    setCart(prev => prev.map(i => {
      const match = keyFor(i) === key || (i.id + "|-|-") === key
      if (!match) return i
      const updated: POSItem = { ...i, size }

      // si encuentro variante, seteo precio dinámico y marco selección completa
      const variant = findSelectedVariant({ ...updated })
      if (variant) {
        updated.price = typeof variant.precio === "number" ? variant.precio : updated.price
        updated.pendingSelection = false
      }
      return updated
    }))
  }

  const increment = (key: string) => {
    setCart(prev => prev.map(i => {
      const match = keyFor(i) === key || (i.id + "|-|-") === key
      if (!match) return i

      // si está pendiente, no permito sumar hasta elegir
      if (i.pendingSelection) return i

      // valida stock por variante
      const variant = findSelectedVariant(i)
      const max = variant ? (variant.cantidad ?? 0) : i.stock
      if (i.quantity >= max) return i

      return { ...i, quantity: i.quantity + 1 }
    }))
  }

  const decrement = (key: string) => {
    setCart(prev => prev.map(i => {
      const match = keyFor(i) === key || (i.id + "|-|-") === key
      if (!match) return i
      return { ...i, quantity: Math.max(1, i.quantity - 1) }
    }))
  }

  const value: POSContextType = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setItemColegio,
    setItemSize,
    increment,
    decrement,
  }

  return <POSContext.Provider value={value}>{children}</POSContext.Provider>
}

export const usePOS = () => {
  const ctx = useContext(POSContext)
  if (!ctx) throw new Error("usePOS must be used within a POSProvider")
  return ctx
}
