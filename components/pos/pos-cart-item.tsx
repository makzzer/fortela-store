"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"

interface VarianteTalle {
  talle: string
  cantidad: number
  precio?: number
}

interface POSItem {
  id: string
  name: string
  price: number
  quantity: number
  size?: string
  stock: number
  qr_code: string
  variantes?: VarianteTalle[]
  pendingSize?: boolean
}

interface POSCartItemProps {
  item: POSItem
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
  onChangeSize?: (size: string) => void
}

export default function POSCartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onChangeSize,
}: POSCartItemProps) {
  const showSizeSelector =
    (!!onChangeSize && (item.variantes?.length ?? 0) > 0) ||
    (!item.size && (item.variantes?.length ?? 0) > 0)

  const varianteSeleccionada = item.size
    ? item.variantes?.find((v) => v.talle === item.size)
    : undefined

  return (
    <div className="flex items-center justify-between border rounded-md p-3 shadow-sm bg-white dark:bg-gray-900">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>

        {/* Línea de talle / pendiente */}
        <div className="text-xs text-muted-foreground">
          {item.size ? `Talle: ${item.size}` : "Talle: (pendiente)"}
        </div>

        {/* Selector de talle */}
        {showSizeSelector && (
          <div className="mt-2">
            <select
              className="border rounded-md px-2 py-1 bg-background text-sm"
              defaultValue={item.size ?? ""}
              onChange={(e) => {
                const value = e.target.value
                if (!value) return
                onChangeSize?.(value)
              }}
            >
              <option value="" disabled>
                Elegí un talle…
              </option>
              {item.variantes?.map((v) => (
                <option
                  key={v.talle}
                  value={v.talle}
                  disabled={(v.cantidad ?? 0) <= 0}
                >
                  {v.talle}
                </option>
              ))}
            </select>

            {/* Info extra del talle elegido */}
            {item.size && varianteSeleccionada && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Stock: {varianteSeleccionada.cantidad ?? 0} • Precio: $
                {typeof varianteSeleccionada.precio === "number"
                  ? varianteSeleccionada.precio.toFixed(2)
                  : item.price.toFixed(2)}
              </div>
            )}
          </div>
        )}

        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">
          ${item.price.toFixed(2)}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center border rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={onDecrement}
            disabled={item.quantity <= 1}
            aria-label="Restar"
          >
            <Minus className="h-3 w-3" />
          </Button>

          <div className="w-8 text-center">{item.quantity}</div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={onIncrement}
            disabled={!item.size}
            aria-label="Sumar"
            title={!item.size ? "Elegí un talle para sumar cantidad" : undefined}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label="Eliminar"
          title="Eliminar del carrito"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
