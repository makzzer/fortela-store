import { useEffect, useState } from "react"

export function useDashboardData() {
  const [totalSales, setTotalSales] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrdenes = async () => {
      try {
        const res = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes?populate=*")
        const data = await res.json()
        const ordenes = data.data

        const total = ordenes.reduce((acc: number, order: any) => {
          const total = order?.total ?? order?.attributes?.total
          return acc + (typeof total === "number" ? total : 0)
        }, 0)

        setTotalSales(total)
      } catch (err) {
        console.error("Error cargando órdenes en dashboard", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrdenes()
  }, [])

  return {
    totalSales,
    isLoading,
  }
}