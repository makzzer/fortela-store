// context/OrdenContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  descripcion?: string; // ahora opcional
  talle?: string;
}

interface ItemComprado {
  id: number;
  cantidad: number;
  producto: Producto;
}

interface OrdenCompleta {
  id: number;
  estado: string;
  total: number;
  fecha: string;
  tipo_venta: string;
  items: ItemComprado[];
}

interface OrdenContextType {
  orden: OrdenCompleta | null;
  setOrden: (orden: OrdenCompleta) => void;
  clearOrden: () => void;
}

const OrdenContext = createContext<OrdenContextType | undefined>(undefined);

export const ItemOrdenProvider = ({ children }: { children: ReactNode }) => {
  const [orden, setOrdenState] = useState<OrdenCompleta | null>(null);

  const setOrden = (ordenData: OrdenCompleta) => {
    setOrdenState(ordenData);
  };

  const clearOrden = () => {
    setOrdenState(null);
  };

  return (
    <OrdenContext.Provider value={{ orden, setOrden, clearOrden }}>
      {children}
    </OrdenContext.Provider>
  );
};

export const useItemOrden = () => {
  const context = useContext(OrdenContext);
  if (!context) throw new Error("useOrden must be used within an OrdenItemProvider");
  return context;
};
