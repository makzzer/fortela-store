'use client'
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const VentasContext = createContext([]);

export const VentasProvider = ({ children }: { children: React.ReactNode }) => {
  const [ventas, setVentas] = useState([]);

  useEffect(() => {
    axios.get("https://vps-4937880-x.dattaweb.com/api/fortela-ventas-por-mostrador")
      .then(res => setVentas(res.data.data))
      .catch(err => console.error("Error cargando ventas", err));
  }, []);

  return (
    <VentasContext.Provider value={ventas}>
      {children}
    </VentasContext.Provider>
  );
};

export const useVentas = () => useContext(VentasContext);
