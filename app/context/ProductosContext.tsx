"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const STRAPI_URL = "https://vps-4937880-x.dattaweb.com";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface VarianteTalle {
  talle: string;
  cantidad: number;
  precio?: number;
}

export interface ColegioBlock {
  colegio: string;
  variantesPorTalles: VarianteTalle[];
}

export interface VarianteBasico {
  color?: string;
  detalle?: string;
  talle?: string;
  cantidad: number;
  precio?: number;
}

export interface Producto {
  id: number;
  documentId: string;
  nombre: string;
  precio: number;
  descripcion?: string;
  genero?: string;
  nivel?: string;
  qr_code?: string;
  stock?: number;
  variantesPorColegio?: ColegioBlock[];
  variantesPorTalle?: VarianteTalle[];
  variantesBasico?: VarianteBasico[];
}

// ─── Context ────────────────────────────────────────────────────────────────────

const ProductosContext = createContext<Producto[]>([]);

export function ProductosProvider({ children }: { children: ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch(
          `${STRAPI_URL}/api/productos?pagination[limit]=500` +
          `&populate[variantesPorColegio][populate]=*` +
          `&populate[variantesPorTalle]=*` +
          `&populate[variantesBasico]=*`
        );
        const data = await res.json();
        const raw: any[] = data?.data ?? [];

        const processed: Producto[] = raw.map((item: any) => {
          const attrs = item.attributes ?? item;
          return {
            id: item.id,
            documentId: item.documentId ?? attrs.documentId,
            nombre: attrs.nombre ?? "",
            precio: attrs.precio ?? 0,
            descripcion: attrs.descripcion ?? "",
            genero: attrs.genero ?? undefined,
            nivel: attrs.nivel ?? undefined,
            qr_code: attrs.qr_code ?? undefined,
            stock: attrs.stock ?? 0,
            variantesPorColegio: Array.isArray(attrs.variantesPorColegio)
              ? attrs.variantesPorColegio
              : [],
            variantesPorTalle: Array.isArray(attrs.variantesPorTalle)
              ? attrs.variantesPorTalle
              : [],
            variantesBasico: Array.isArray(attrs.variantesBasico)
              ? attrs.variantesBasico
              : [],
          };
        });

        setProductos(processed);
      } catch (err) {
        console.error("Error fetching productos:", err);
      }
    };

    fetchProductos();
  }, []);

  return (
    <ProductosContext.Provider value={productos}>
      {children}
    </ProductosContext.Provider>
  );
}

export function useProductos(): Producto[] {
  return useContext(ProductosContext);
}
