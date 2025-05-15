'use client'
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const ProductosContext = createContext([]);

export const ProductosProvider = ({ children }: { children: React.ReactNode }) => {
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    axios.get("https://vps-4937880-x.dattaweb.com/api/productos")
      .then(res => setProductos(res.data.data))
      .catch(err => console.error("Error cargando productos", err));
  }, []);

  return (
    <ProductosContext.Provider value={productos}>
      {children}
    </ProductosContext.Provider>
  );
};

export const useProductos = () => useContext(ProductosContext);
