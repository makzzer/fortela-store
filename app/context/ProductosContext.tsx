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
  precio: number
  stock: number
  genero: string
  qr_code?: string
  colegio?: string[]            // ahora array
  nivel_educativo?: string[]
  variantesPorTalle?: VariantePorTalle[]
}

const ProductosContext = createContext<Producto[]>([])

export const ProductosProvider = ({ children }: { children: React.ReactNode }) => {
  const [productos, setProductos] = useState<Producto[]>([])

  useEffect(() => {
    const fetchAll = async () => {
      const base = "https://vps-4937880-x.dattaweb.com/api/productos"
      const pageSize = 200
      let page = 1
      let all: any[] = []

      while (true) {
        const { data } = await axios.get(
          `${base}?populate=*&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
        )
        all = all.concat(data.data)
        const { pageCount } = data.meta.pagination
        if (page >= pageCount) break
        page++
      }

      const processed = all.map((item: any) => {
        const variantes = item.variantesPorTalle || []
        const totalStock = variantes.reduce((sum: number, v: any) => sum + (v.cantidad || 0), 0)

        return {
          id: item.id,
          documentId: item.documentId,
          nombre: item.nombre,
          descripcion: item.descripcion,
          precio: item.precio,
          stock: totalStock,
          genero: item.genero,
          qr_code: item.qr_code,
          colegio: item.colegio,                   // array de strings
          nivel_educativo: item.nivel_educativo,
          variantesPorTalle: variantes.map((v: any) => ({
            id: v.id, talle: v.talle, cantidad: v.cantidad, precio: v.precio
          })),
        } as Producto
      })

      setProductos(processed)
    }

    fetchAll().catch((err) => console.error("Error cargando productos", err))
  }, [])

  return <ProductosContext.Provider value={productos}>{children}</ProductosContext.Provider>
}

export const useProductos = () => useContext(ProductosContext)
