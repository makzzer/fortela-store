'use client'

import { createContext, useContext, useEffect, useState } from "react"
import axios from "axios"

interface VariantePorTalle {
  id: number
  talle: string
  cantidad: number
  precio: number
}

interface VariantesPorColegio {
  colegio?: string | null
  // En tu Strapi quedó "variantesPorTalles" (con s). Usamos ambos por compat.
  variantesPorTalles?: VariantePorTalle[]
  variantesPorTalle?: VariantePorTalle[]
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
  colegio?: string[]
  nivel_educativo?: string[]
  // Viejo (global, sin colegio)
  variantesPorTalle?: VariantePorTalle[]
  // Nuevo (por colegio)
  variantesPorColegio?: VariantesPorColegio[]
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
        // 👇 Populate dirigido para traer los talles dentro de cada colegio
        const { data } = await axios.get(
          `${base}?pagination[page]=${page}&pagination[pageSize]=${pageSize}`
          + `&populate[variantesPorColegio][populate]=*`
          // si necesitás imagen u otros, agregalos con otro populate=...
        )
        all = all.concat(data.data)
        const { pageCount } = data.meta.pagination
        if (page >= pageCount) break
        page++
      }

      const processed = all.map((item: any) => {
        // Normalizamos: algunos docs pueden venir con nombres viejos o valores no array
        const rawVpc =
          item.variantesPorColegio ?? item.VariantesPorColegio ?? null
        const vpc: any[] = Array.isArray(rawVpc) ? rawVpc : (rawVpc ? [rawVpc] : [])

        const vptGlobal = item.variantesPorTalle ?? item.variantesPorTalles ?? []

        let totalStock = 0

        // Sumar stock desde el esquema nuevo (colegio -> talles)
        const variantesPorColegio: VariantesPorColegio[] = vpc.map((row: any) => {
          const nested = row.variantesPorTalle ?? row.variantesPorTalles ?? []
          const talles: VariantePorTalle[] = (nested || []).map((v: any) => {
            totalStock += v.cantidad || 0
            return {
              id: v.id,
              talle: v.talle,
              cantidad: v.cantidad,
              precio: v.precio,
            }
          })
          return {
            colegio: row.colegio ?? null,
            variantesPorTalles: talles,   // guardamos en el nombre “actual”
          }
        })

        // Compat: si no hay colegios, calculamos el total con el array global de talles
        if (!vpc.length && vptGlobal.length) {
          totalStock = vptGlobal.reduce((s: number, v: any) => s + (v.cantidad || 0), 0)
        }

        return {
          id: item.id,
          documentId: item.documentId,
          nombre: item.nombre,
          descripcion: item.descripcion,
          precio: item.precio,
          stock: totalStock,               // ← total del producto (1 solo QR)
          genero: item.genero,
          qr_code: item.qr_code,
          colegio: item.colegio,
          nivel_educativo: item.nivel_educativo,
          variantesPorTalle: (vptGlobal || []).map((v: any) => ({
            id: v.id, talle: v.talle, cantidad: v.cantidad, precio: v.precio
          })),
          variantesPorColegio,
        } as Producto
      })

      setProductos(processed)
    }

    fetchAll().catch((err) => console.error("Error cargando productos", err))
  }, [])

  return <ProductosContext.Provider value={productos}>{children}</ProductosContext.Provider>
}

export const useProductos = () => useContext(ProductosContext)
