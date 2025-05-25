'use client';

import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

// ✅ Tipo de producto basado en tu backend
interface Producto {
  id: number;
  documentId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  stock: number;
  genero: string;
  talles?: string[];
  qr_code?: string;
}

// ✅ Contexto tipado
const ProductosContext = createContext<Producto[]>([]);

export const ProductosProvider = ({ children }: { children: React.ReactNode }) => {
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    axios
      .get("https://vps-4937880-x.dattaweb.com/api/productos")
      .then((res) => setProductos(res.data.data))
      .catch((err) => console.error("Error cargando productos", err));
  }, []);

  return (
    <ProductosContext.Provider value={productos}>
      {children}
    </ProductosContext.Provider>
  );
};

export const useProductos = () => useContext(ProductosContext);
