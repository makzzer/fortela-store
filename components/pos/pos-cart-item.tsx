"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Minus, Plus, Trash2, AlertCircle } from "lucide-react"

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
  idStrapiProducto?: number
  documentId: string
  name: string
  price: number
  quantity: number
  size?: string
  stock: number
  totalStock: number
  qr_code: string
  colegio?: string
  variantes?: VarianteTalle[]
  variantesPorColegio?: ColegioBlock[]
  pendingSize?: boolean
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
  const isPending = item.pendingSize || item.pendingSelection
  const precioVisible =
    typeof selectedVar?.precio === "number" ? selectedVar.precio : item.price
  const subtotal = precioVisible * item.quantity

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
      isPending
        ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800"
        : "border-border bg-card"
    }`}>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <span className="font-medium text-sm leading-snug truncate">{item.name}</span>
          {isPending && (
            <Badge
              variant="outline"
              className="text-xs border-amber-400 text-amber-700 dark:text-amber-400 shrink-0 gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              Talle pendiente
            </Badge>
          )}
        </div>

        {/* Colegio + Talle display */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {item.colegio && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {item.colegio}
            </span>
          )}
          {item.size && (
            <span className="text-xs text-muted-foreground">
              Talle <span className="font-medium text-foreground uppercase">{item.size}</span>
            </span>
          )}
          {!item.size && !isPending && hasColegio && !item.colegio && (
            <span className="text-xs text-muted-foreground">Colegio: (pendiente)</span>
          )}
          {!item.size && !isPending && !hasColegio && hasLegacy && (
            <span className="text-xs text-muted-foreground">Talle: (pendiente)</span>
          )}
          <span className="text-xs text-muted-foreground">
            ${precioVisible.toLocaleString("es-AR")} c/u
          </span>
        </div>

        {/* Inline selectors (only when inlineSizeSelector=true) */}
        {showSelectors && (
          <div className="mt-2 space-y-2">
            {hasColegio && (
              <select
                className="border rounded-md px-2 py-1 bg-background text-sm w-full"
                value={item.colegio ?? ""}
                onChange={(e) => onChangeColegio?.(e.target.value)}
              >
                <option value="" disabled>Elegí un colegio…</option>
                {item.variantesPorColegio!.map((c) => (
                  <option key={c.colegio} value={c.colegio}>{c.colegio}</option>
                ))}
              </select>
            )}
            <select
              className="border rounded-md px-2 py-1 bg-background text-sm w-full"
              value={item.size ?? ""}
              onChange={(e) => onChangeSize?.(e.target.value)}
              disabled={hasColegio && !item.colegio}
            >
              <option value="" disabled>Elegí un talle…</option>
              {variantesDisponibles.map((v) => (
                <option key={v.talle} value={v.talle} disabled={(v.cantidad ?? 0) <= 0}>
                  {v.talle}
                </option>
              ))}
            </select>
            {item.size && selectedVar && (
              <div className="text-xs text-muted-foreground">
                Stock: {selectedVar.cantidad ?? 0} • Precio: $
                {typeof selectedVar.precio === "number"
                  ? selectedVar.precio.toLocaleString("es-AR")
                  : item.price.toLocaleString("es-AR")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: qty + subtotal + remove */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={onDecrement}
            disabled={item.quantity <= 1 || isPending}
            aria-label="Restar"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm font-medium tabular-nums">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={onIncrement}
            disabled={isPending || (item.pendingSelection ?? false) || (!item.size && (hasColegio || hasLegacy))}
            aria-label="Sumar"
            title={isPending ? "Elegí talle primero" : undefined}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <span className="text-sm font-semibold tabular-nums w-20 text-right">
          ${subtotal.toLocaleString("es-AR")}
        </span>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          aria-label="Eliminar"
          title="Eliminar del carrito"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
