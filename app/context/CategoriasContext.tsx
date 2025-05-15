'use client'
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const CategoriasContext = createContext([]);

export const CategoriasProvider = ({ children }: { children: React.ReactNode }) => {
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    axios.get("https://vps-4937880-x.dattaweb.com/api/fortela-categorias")
      .then(res => setCategorias(res.data.data))
      .catch(err => console.error("Error cargando categorías", err));
  }, []);

  return (
    <CategoriasContext.Provider value={categorias}>
      {children}
    </CategoriasContext.Provider>
  );
};

export const useCategorias = () => useContext(CategoriasContext);
