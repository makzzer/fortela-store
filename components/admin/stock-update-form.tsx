"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Swal from "sweetalert2"

interface StockUpdateFormProps {
  productId: string // documentId
  talle: string
}

interface Variante {
  talle: string
  cantidad: number
  precio: number
}

export default function StockUpdateForm({ productId, talle }: StockUpdateFormProps) {
  const [operation, setOperation] = useState<"add" | "remove">("add")
  const [quantity, setQuantity] = useState<number | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [producto, setProducto] = useState<any>(null)
  const [internalId, setInternalId] = useState<number | null>(null)
  const [debugPayload, setDebugPayload] = useState<any>(null)
  const [putErrorMessage, setPutErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const res = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${productId}&populate=*`
        )
        const responseText = await res.text()
        let parsedJson: any = null
        try {
          parsedJson = JSON.parse(responseText)
        } catch (e) { }

        if (!res.ok) {
          throw new Error(
            `Error ${res.status} ${res.statusText}\n\n` +
            (parsedJson ? JSON.stringify(parsedJson, null, 2) : responseText)
          )
        }

        const data = parsedJson
        const productoData = data?.data?.[0]
        if (!productoData) throw new Error("Producto no encontrado")

        setProducto(productoData)
        setInternalId(productoData.id)
        setPutErrorMessage(null) // limpiamos errores anteriores
      } catch (err: any) {
        console.error("ERROR FETCH:", err)
        setPutErrorMessage(err.message)

        Swal.fire({
          title: "Error al cargar producto",
          icon: "error",
          html: `<pre style="text-align:left;overflow-x:auto;font-size:11px">${err.message}</pre>`,
          customClass: { popup: "text-left" },
          width: 600,
        })
      }
    }

    if (productId && talle) fetchProducto()
  }, [productId, talle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!producto || quantity === "" || internalId === null) return

    const variantes: Variante[] = producto.variantesPorTalle || []
    const index = variantes.findIndex((v) => v.talle === talle)

    if (index === -1) {
      Swal.fire("Error", "Talle no encontrado en el producto", "error")
      return
    }

    const stockActual = variantes[index].cantidad

    if (operation === "remove" && quantity > stockActual) {
      Swal.fire("Cantidad inválida", `Solo hay ${stockActual} unidades en stock`, "warning")
      return
    }

    const nuevaCantidad =
      operation === "add"
        ? stockActual + quantity
        : Math.max(0, stockActual - quantity)

    const nuevasVariantes = variantes.map((v, i) => {
      const nueva = { ...v, cantidad: i === index ? nuevaCantidad : v.cantidad }
      delete (nueva as any).id
      return nueva
    })


    const payload = {
      data: {
        variantesPorTalle: nuevasVariantes,
        stock: nuevasVariantes.reduce((acc, v) => acc + v.cantidad, 0),
        precio: Math.min(...nuevasVariantes.map((v) => v.precio)),
      },
    }

    setDebugPayload(payload)
    setIsSubmitting(true)

    try {
      const putRes = await fetch(
        `https://vps-4937880-x.dattaweb.com/api/productos/${productId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const responseText = await putRes.text()
      if (!putRes.ok) {
        setPutErrorMessage(`PUT falló - status ${putRes.status}\n\n${responseText}`)

        throw new Error(
          `PUT falló - status ${putRes.status}\n\n${responseText}`
        )
      }

      setProducto((prev: any) => ({
        ...prev,
        variantesPorTalle: nuevasVariantes,
      }))
      setQuantity("")
      setPutErrorMessage(null)
      await Swal.fire("Actualizado", `Nuevo stock para talle ${talle}: ${nuevaCantidad}`, "success")
    } catch (err: any) {
      console.error("PUT ERROR:", err)
      setPutErrorMessage(err.message)

      Swal.fire({
        title: "Error al actualizar stock",
        icon: "error",
        html: `<pre style="text-align:left;overflow-x:auto;font-size:11px">${err.message}</pre>`,
        customClass: { popup: "text-left" },
        width: 600,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!producto) return <p className="text-sm text-muted-foreground">Cargando producto...</p>

  const variantes: Variante[] = producto.variantesPorTalle || []
  const variante = variantes.find((v) => v.talle === talle)
  if (!variante) return <p className="text-sm text-red-500">Talle no encontrado.</p>

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm">
        <p><strong>Producto:</strong> {producto.nombre}</p>
        <p><strong>Talle:</strong> {talle}</p>
        <p><strong>Stock actual:</strong> {variante.cantidad}</p>
      </div>

      <div className="bg-muted p-3 rounded-md text-sm">
        <p className="font-medium mb-2">Stock por talle:</p>
        <ul className="list-disc ml-4 space-y-1">
          {variantes.map((v) => (
            <li key={v.talle} className={v.talle === talle ? "font-semibold text-primary" : ""}>
              {v.talle}: {v.cantidad} unidades
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <Button
            type="button"
            variant={operation === "add" ? "default" : "outline"}
            onClick={() => setOperation("add")}
            className="flex-1"
          >
            + Sumar stock
          </Button>

          <div className="text-muted-foreground text-sm w-32 text-center">
            {quantity !== "" && (
              <>
                {operation === "add" ? "Agregar" : "Quitar"}{" "}
                <strong>{quantity}</strong> unidad{quantity !== 1 ? "es" : ""}
              </>
            )}
          </div>

          <Button
            type="button"
            variant={operation === "remove" ? "default" : "outline"}
            onClick={() => setOperation("remove")}
            className="flex-1"
          >
            – Restar stock
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value === "" ? "" : parseInt(e.target.value))
            }
          />
        </div>
      </div>

      {debugPayload && (
        <pre className="bg-gray-100 text-xs p-3 rounded border overflow-auto">
          {JSON.stringify(debugPayload, null, 2)}
        </pre>
      )}

      {putErrorMessage && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-3 text-xs rounded-md whitespace-pre-wrap overflow-auto">
          <strong>Detalle del error al guardar:</strong>
          <pre>{putErrorMessage}</pre>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || quantity === ""}>
        {isSubmitting ? "Actualizando..." : "Actualizar stock"}
      </Button>
    </form>
  )
}
