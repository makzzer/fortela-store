'use client'
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const OrdenesContext = createContext([]);

export const OrdenesProvider = ({ children }: { children: React.ReactNode }) => {
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    axios.get("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes?populate=*")
      .then(res => setOrdenes(res.data.data))
      .catch(err => console.error("Error cargando órdenes", err));
  }, []);

  return (
    <OrdenesContext.Provider value={ordenes}>
      {children}
    </OrdenesContext.Provider>
  );
};

export const useOrdenes = () => useContext(OrdenesContext);
