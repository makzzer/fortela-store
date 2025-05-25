'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Swal from 'sweetalert2'

const generosUI = [
  { label: 'Niña', value: 'niña' },
  { label: 'Niño', value: 'niño' },
  { label: 'Unisex', value: 'unisex' },
]

const tallesDisponibles = ['XS', 'S', 'M', 'L']

export default function AddProductPage() {
  const router = useRouter()
  const [resultado, setResultado] = useState<string | null>(null)
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    genero: '',
    talles: [] as string[],
    qr_code: '',
    imagen: null as File | null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, imagen: e.target.files?.[0] ?? null })
  }

  const toggleTalle = (talle: string) => {
    setForm((prev) => ({
      ...prev,
      talles: prev.talles.includes(talle)
        ? prev.talles.filter((t) => t !== talle)
        : [...prev.talles, talle],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      precio: form.precio !== '' ? Number(form.precio) : 0,
      stock: form.stock !== '' ? Number(form.stock) : 0,
      genero: form.genero.trim() || 'unisex',
      talles: form.talles,
      qr_code: form.qr_code.trim(),
    }

    try {
      const res = await fetch('https://vps-4937880-x.dattaweb.com/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: payload }),
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('❌ Error en la respuesta:', data)
        setResultado(`Error: ${JSON.stringify(data.error)}`)
        throw new Error(`Error HTTP ${res.status}`)
      }

      await Swal.fire({
        icon: 'success',
        title: 'Producto creado',
        text: 'El producto fue guardado correctamente',
        confirmButtonText: 'OK',
      })

      router.push('/admin/products')
    } catch (error) {
      console.error(error)
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar el producto' })
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Agregar nuevo producto</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" name="descripcion" value={form.descripcion} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="precio">Precio</Label>
            <Input id="precio" name="precio" type="number" value={form.precio} onChange={handleChange} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" name="stock" type="number" value={form.stock} onChange={handleChange} required />
          </div>
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
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label>Talles</Label>
          <div className="flex flex-wrap gap-2">
            {tallesDisponibles.map((talle) => (
              <button
                type="button"
                key={talle}
                onClick={() => toggleTalle(talle)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  form.talles.includes(talle)
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700'
                }`}
              >
                {talle}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="qr_code">Código QR (opcional)</Label>
          <Input id="qr_code" name="qr_code" value={form.qr_code} onChange={handleChange} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="imagen">Imagen (por ahora no se sube)</Label>
          <Input id="imagen" type="file" accept="image/*" onChange={handleFileChange} />
          {form.imagen && <p className="text-sm text-muted-foreground">Imagen seleccionada: {form.imagen.name}</p>}
        </div>

        <Button type="submit" className="w-full">Crear producto</Button>
      </form>
      {resultado && <p className="text-sm text-muted-foreground">{resultado}</p>}
    </div>
  )
}
