'use client'

import { createContext, useContext, useEffect, useState } from "react"
import axios from "axios"

interface VariantePorTalle {
  id: number
  talle: string
  cantidad: number
  precio: number
}

interface Producto {
  id: number
  documentId: string
  nombre: string
  descripcion?: string
  precio: number // puede ser precio base o promedio, depende cómo lo uses
  stock: number
  genero: string
  qr_code?: string
  colegio?: string
  nivel_educativo?: string[]
  variantesPorTalle?: VariantePorTalle[]
}

const ProductosContext = createContext<Producto[]>([])

export const ProductosProvider = ({ children }: { children: React.ReactNode }) => {
  const [productos, setProductos] = useState<Producto[]>([])

  useEffect(() => {
    axios
      .get("https://vps-4937880-x.dattaweb.com/api/productos?populate=*")
      .then((res) => {
        const processed = res.data.data.map((item: any) => {
          const variantes = item.variantesPorTalle || []

          const totalStock = variantes.reduce(
            (sum: number, v: any) => sum + (v.cantidad || 0),
            0
          )

          return {
            id: item.id,
            documentId: item.documentId,
            nombre: item.nombre,
            descripcion: item.descripcion,
            precio: item.precio,
            stock: totalStock,
            genero: item.genero,
            qr_code: item.qr_code,
            colegio: item.colegio,
            nivel_educativo: item.nivel_educativo,
            variantesPorTalle: variantes.map((v: any) => ({
              id: v.id,
              talle: v.talle,
              cantidad: v.cantidad,
              precio: v.precio,
            })),
          }
        })

        setProductos(processed)
      })
      .catch((err) => console.error("Error cargando productos", err))
  }, [])

  return (
    <ProductosContext.Provider value={productos}>
      {children}
    </ProductosContext.Provider>
  )
}

export const useProductos = () => useContext(ProductosContext)
