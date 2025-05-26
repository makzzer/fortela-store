'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
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

export default function EditProductPage() {
    const router = useRouter()
    const { documentId } = useParams()
    console.log("📦 documentId:", documentId)


    const [cargando, setCargando] = useState(true)
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

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${documentId}`)
                const data = await res.json()
                console.log("🟢 Producto recibido:", data)

                const producto = data?.data
                if (producto) {
                    setForm({
                        nombre: producto.nombre || '',
                        descripcion: producto.descripcion || '',
                        precio: producto.precio?.toString() || '',
                        stock: producto.stock?.toString() || '',
                        genero: producto.genero || '',
                        talles: producto.talles || [],
                        qr_code: producto.qr_code || '',
                        imagen: null,
                    })
                }
            } catch (error) {
                console.error('Error cargando producto:', error)
            } finally {
                setCargando(false)
            }
        }

        if (documentId) {
            fetchProduct()
        }
    }, [documentId])

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
        }

        try {
            const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${documentId}`, {
                method: 'PUT',
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
                title: 'Producto actualizado',
                text: 'Los cambios fueron guardados correctamente',
                confirmButtonText: 'OK',
            })

            router.push('/admin/products')
        } catch (error) {
            console.error(error)
            Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el producto' })
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
                                className={`px-3 py-1 rounded-full border text-sm ${form.talles.includes(talle)
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
                    <Label htmlFor="imagen">Imagen (por ahora no se sube)</Label>
                    <Input id="imagen" type="file" accept="image/*" onChange={handleFileChange} />
                    {form.imagen && <p className="text-sm text-muted-foreground">Imagen seleccionada: {form.imagen.name}</p>}
                </div>

                <Button type="submit" className="w-full">Guardar cambios</Button>
                <div className="flex gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full bg-gray-300/40"
                        onClick={() => router.push('/admin/products')}
                    >
                        Cancelar
                    </Button>
                </div>

            </form>
            {resultado && <p className="text-sm text-muted-foreground">{resultado}</p>}
        </div>
    )
}
