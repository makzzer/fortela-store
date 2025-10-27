"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2 } from "lucide-react"

interface VarianteTalle {
  talle: string
  cantidad: number
  precio?: number
}
interface ColegioBlock {
  colegio: string
  variantesPorTalles: VarianteTalle[]
}

interface POSItem {
  id: string
  idStrapiProducto?: number // ← opcional, no rompe si no lo usás acá
  name: string
  price: number
  quantity: number
  size?: string
  stock: number
  qr_code: string

  colegio?: string
  variantes?: VarianteTalle[]          // legacy
  variantesPorColegio?: ColegioBlock[] // nuevo
  pendingSelection?: boolean
}

interface POSCartItemProps {
  item: POSItem
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
  onChangeColegio?: (colegio: string) => void
  onChangeSize?: (size: string) => void
  inlineSizeSelector?: boolean
}

export default function POSCartItem({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onChangeColegio,
  onChangeSize,
  inlineSizeSelector = true,
}: POSCartItemProps) {
  const hasColegio = (item.variantesPorColegio?.length ?? 0) > 0
  const hasLegacy = (item.variantes?.length ?? 0) > 0

  const block = hasColegio
    ? item.variantesPorColegio!.find((b) => b.colegio === item.colegio)
    : undefined

  const variantesDisponibles: VarianteTalle[] =
    hasColegio ? (block?.variantesPorTalles ?? []) : (item.variantes ?? [])

  const selectedVar = variantesDisponibles.find(v => v.talle === item.size)

  const showSelectors = inlineSizeSelector && (hasColegio || hasLegacy)

  const precioVisible =
    typeof selectedVar?.precio === "number" ? selectedVar!.precio : item.price

  return (
    <div className="flex items-center justify-between border rounded-md p-3 shadow-sm bg-white dark:bg-gray-900">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>


        {/* Colegio + Talle (estado) */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {hasColegio && (
            <>
              {item.colegio ? (
                <>
                  Colegio: {item.colegio}
                  {item.size ? ` • Talle: ${item.size}` : " • Talle: (pendiente)"}
                </>
              ) : (
                "Colegio: (pendiente)"
              )}
            </>
          )}

          {!hasColegio && (
            <>
              {item.size
                ? `Talle: ${item.size}`
                : hasLegacy
                  ? "Talle: (pendiente)"
                  : null}
            </>
          )}
        </div>



        {/* Selectores */}
        {showSelectors && (
          <div className="mt-2 space-y-2">
            {/* Selector de colegio (si aplica) */}
            {hasColegio && (
              <select
                className="border rounded-md px-2 py-1 bg-background text-sm w-full"
                value={item.colegio ?? ""}
                onChange={(e) => onChangeColegio?.(e.target.value)}
              >
                <option value="" disabled>
                  Elegí un colegio…
                </option>
                {item.variantesPorColegio!.map((c) => (
                  <option key={c.colegio} value={c.colegio}>
                    {c.colegio}
                  </option>
                ))}
              </select>
            )}

            {/* Selector de talle (filtrado por colegio si hay) */}
            <select
              className="border rounded-md px-2 py-1 bg-background text-sm w-full"
              value={item.size ?? ""}
              onChange={(e) => onChangeSize?.(e.target.value)}
              disabled={hasColegio && !item.colegio}
            >
              <option value="" disabled>
                Elegí un talle…
              </option>
              {variantesDisponibles.map((v) => (
                <option key={v.talle} value={v.talle} disabled={(v.cantidad ?? 0) <= 0}>
                  {v.talle}
                </option>
              ))}
            </select>

            {/* Info de la variante elegida */}
            {item.size && selectedVar && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Stock: {selectedVar.cantidad ?? 0} • Precio: $
                {typeof selectedVar.precio === "number"
                  ? selectedVar.precio.toFixed(2)
                  : item.price.toFixed(2)}
              </div>
            )}
          </div>
        )}

        <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
          ${precioVisible.toFixed(2)}
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
            disabled={item.pendingSelection || !item.size}
            aria-label="Sumar"
            title={item.pendingSelection ? "Elegí colegio y talle" : (!item.size ? "Elegí un talle" : undefined)}
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
