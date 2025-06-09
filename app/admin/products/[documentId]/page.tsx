"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import Swal from "sweetalert2"
import { Trash2 } from "lucide-react"

const generosUI = [
  { label: "Niña", value: "niña" },
  { label: "Niño", value: "niño" },
  { label: "Unisex", value: "unisex" },
]

interface VarianteTalle {
  talle: string
  cantidad: number
  precio: number
}

export default function EditProductPage() {
  const router = useRouter()
  const { documentId } = useParams()
  const [cargando, setCargando] = useState(true)
  const [resultado, setResultado] = useState<string | null>(null)
  const [nuevoTalle, setNuevoTalle] = useState("")
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    genero: "",
    imagen: null as File | null,
    variantesPorTalle: [] as VarianteTalle[],
  })

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos/${documentId}?populate=*`
        )
        const data = await res.json()
        const producto = data?.data

        if (producto) {
          setForm({
            nombre: producto.nombre || "",
            descripcion: producto.descripcion || "",
            genero: producto.genero || "",
            imagen: null,
            variantesPorTalle:
              producto.variantesPorTalle?.map((v: any) => ({
                talle: v.talle,
                cantidad: v.cantidad,
                precio: v.precio,
              })) || [],
          })
        }
      } catch (error) {
        console.error("Error cargando producto:", error)
      } finally {
        setCargando(false)
      }
    }

    if (documentId) fetchProduct()
  }, [documentId])

  const agregarTalle = () => {
    const talle = nuevoTalle.trim().toUpperCase()
    if (!talle) return
    if (form.variantesPorTalle.some((v) => v.talle === talle)) return

    setForm((prev) => ({
      ...prev,
      variantesPorTalle: [...prev.variantesPorTalle, { talle, cantidad: 0, precio: 0 }],
    }))
    setNuevoTalle("")
  }

  const eliminarTalle = (talle: string) => {
    setForm((prev) => ({
      ...prev,
      variantesPorTalle: prev.variantesPorTalle.filter((v) => v.talle !== talle),
    }))
  }

  const handleVarianteChange = (talle: string, field: "cantidad" | "precio", value: number) => {
    setForm((prev) => ({
      ...prev,
      variantesPorTalle: prev.variantesPorTalle.map((v) =>
        v.talle === talle ? { ...v, [field]: value } : v
      ),
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    const formattedValue =
      name === "nombre" ? value.charAt(0).toUpperCase() + value.slice(1) : value
    setForm({ ...form, [name]: formattedValue })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, imagen: e.target.files?.[0] ?? null })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const variantesActivas = form.variantesPorTalle.filter((v) => v.cantidad > 0 && v.precio > 0)
    const totalStock = variantesActivas.reduce((sum, v) => sum + v.cantidad, 0)
    const minPrecio = Math.min(...variantesActivas.map((v) => v.precio))

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      genero: form.genero || "unisex",
      precio: minPrecio || 0,
      stock: totalStock || 0,
      variantesPorTalle: variantesActivas.map(({ talle, cantidad, precio }) => ({
        talle,
        cantidad,
        precio,
      })),
    }

    try {
      const res = await fetch(
        `https://vps-4937880-x.dattaweb.com/api/productos/${documentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: payload }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(`Error HTTP ${res.status}`)

      await Swal.fire({
        icon: "success",
        title: "Producto actualizado",
        confirmButtonText: "OK",
      })
      router.push("/admin/products")
    } catch (error) {
      console.error(error)
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo actualizar el producto" })
    }
  }

  if (cargando) return <p className="p-6">Cargando...</p>

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Editar producto</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" name="descripcion" value={form.descripcion} onChange={handleChange} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="genero">Género</Label>
          <select
            id="genero"
            name="genero"
            className="border rounded px-3 py-2"
            value={form.genero}
            onChange={(e) => setForm({ ...form, genero: e.target.value })}
            required
          >
            <option value="">Seleccionar</option>
            {generosUI.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label>Variantes por talle</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Ej: S, M, 2, 4, etc."
              value={nuevoTalle}
              onChange={(e) => setNuevoTalle(e.target.value.toUpperCase())}
              className="flex-1"
            />
            <Button type="button" onClick={agregarTalle}>
              Agregar
            </Button>
          </div>

          <div className="grid gap-3 mt-2">
            {form.variantesPorTalle.map((v) => (
              <div
                key={v.talle}
                className="grid grid-cols-6 items-center gap-3 border rounded-lg p-3 bg-gray-50"
              >
                <span className="col-span-1 font-medium text-sm text-gray-700">{v.talle}</span>

                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">Stock</Label>
                  <Input
                    type="number"
                    value={String(v.cantidad)}
                    min={0}
                    onChange={(e) =>
                      handleVarianteChange(v.talle, "cantidad", Number(e.target.value || 0))
                    }
                  />
                </div>

                <div className="col-span-2 relative">
                  <Label className="text-xs text-gray-500">Precio</Label>
                  <span className="absolute left-3 top-[36px] text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={String(v.precio)}
                    min={0}
                    onChange={(e) =>
                      handleVarianteChange(v.talle, "precio", Number(e.target.value || 0))
                    }
                    className="pl-7"
                  />
                </div>

                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    onClick={() => eliminarTalle(v.talle)}
                    variant="ghost"
                    size="icon"
                    className="text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="imagen">Imagen (por ahora no se sube)</Label>
          <Input id="imagen" type="file" accept="image/*" onChange={handleFileChange} />
          {form.imagen && (
            <p className="text-sm text-muted-foreground">
              Imagen seleccionada: {form.imagen.name}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full">
          Guardar cambios
        </Button>
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-gray-300/40"
            onClick={() => router.push("/admin/products")}
          >
            Cancelar
          </Button>
        </div>
      </form>
      {resultado && <p className="text-sm text-muted-foreground">{resultado}</p>}
    </div>
  )
}
