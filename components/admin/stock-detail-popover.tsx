// components/admin/stock-detail-popover.tsx
"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"

interface Variante {
  talle: string
  precio: number
  cantidad: number
}

interface Props {
  variantes: Variante[]
}

export default function StockDetailPopover({ variantes }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm">
          Ver detalle <Info className="w-4 h-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4">
        <p className="text-sm font-semibold mb-2">Stock por talle</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-muted-foreground text-xs border-b">
              <th className="text-left py-1">Talle</th>
              <th className="text-left py-1">Precio</th>
              <th className="text-left py-1">Stock</th>
            </tr>
          </thead>
          <tbody>
            {variantes.map((v) => (
              <tr
                key={v.talle}
                className={`border-b ${v.cantidad <= 10 ? "bg-red-100 text-red-800 font-semibold" : ""}`}
              >
                <td className="py-1">{v.talle}</td>
                <td className="py-1">${v.precio.toLocaleString()}</td>
                <td className="py-1">{v.cantidad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PopoverContent>
    </Popover>
  )
}
