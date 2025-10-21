'use client'

import { createContext, useContext, useEffect, useState } from "react"
import axios from "axios"

interface Orden {
  id: number
  documentId: string
  attributes: any
}

interface OrdenesContextValue {
  ordenes: Orden[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const OrdenesContext = createContext<OrdenesContextValue | undefined>(undefined)

export const OrdenesProvider = ({ children }: { children: React.ReactNode }) => {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrdenes = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(
        "https://vps-4937880-x.dattaweb.com/api/fortela-ordenes?populate=*"
      )
      setOrdenes(res.data.data || [])
    } catch (err: any) {
      console.error("Error cargando órdenes:", err)
      setError(err?.message ?? "Error cargando órdenes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrdenes()
  }, [])

  return (
    <OrdenesContext.Provider value={{ ordenes, loading, error, refresh: fetchOrdenes }}>
      {children}
    </OrdenesContext.Provider>
  )
}

export const useOrdenes = () => {
  const context = useContext(OrdenesContext)
  if (!context) {
    throw new Error("useOrdenes debe usarse dentro de un <OrdenesProvider>")
  }
  return context
}
