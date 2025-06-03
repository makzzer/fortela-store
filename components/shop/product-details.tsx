"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import AddToCartButton from "./add-to-cart-button"
import { Skeleton } from "@/components/ui/skeleton"
import QRCode from "react-qr-code"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductDetailsProps {
  id: string
}

export default function ProductDetails({ id }: ProductDetailsProps) {
  const [product, setProduct] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${id}&populate=*`, {
          cache: "no-store",
        })

        const data = await res.json()
        const productData = data.data?.[0]

        if (!productData) {
          console.error("Producto no encontrado")
          setLoading(false)
          return
        }

        const variantes = productData.variantesPorTalle || []

        const totalStock = variantes.reduce((sum: number, v: any) => sum + (v.cantidad || 0), 0)

        setProduct({
          documentId: productData.documentId,
          name: productData.nombre,
          description: productData.descripcion,
          price: productData.precio,
          stock: totalStock,
          variantesPorTalle: variantes,
          image: "/bana.webp", // reemplazá si usás media real
        })
      } catch (error) {
        console.error("Error fetching product details", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const getStockForSelectedSize = () => {
    if (!selectedSize || !product?.variantesPorTalle) return null
    const variante = product.variantesPorTalle.find((v: any) => v.talle === selectedSize)
    return variante ? variante.cantidad : 0
  }

  if (loading || !product) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-96 w-full" />
        <div>
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-6" />
          <Skeleton className="h-24 w-full mb-6" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="relative w-full aspect-square">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover rounded-md"
        />
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-muted-foreground mb-4">{product.description}</p>
        <p className="text-2xl font-semibold mb-2">${product.price.toFixed(2)}</p>

        <p className={`text-sm mb-2 ${product.stock <= 5 ? "text-red-500 font-medium" : "text-green-600"}`}>
          {product.stock <= 5
            ? `¡Quedan solo ${product.stock} unidad${product.stock === 1 ? "" : "es"}!`
            : `Quedan ${product.stock} unidades en total`}
        </p>

        {/* Selector de talle */}
        {product.variantesPorTalle?.length > 0 && (
          <div className="mb-4">
            <Label>Talle</Label>
            <Select onValueChange={(value) => setSelectedSize(value)}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Elegí un talle" />
              </SelectTrigger>
              <SelectContent>
                {product.variantesPorTalle.map((v: any) => (
                  <SelectItem key={v.talle} value={v.talle}>
                    {v.talle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stock del talle seleccionado */}
        {selectedSize && (
          <p className="text-sm text-blue-600 mb-6">
            Quedan {getStockForSelectedSize()} unidad(es) del talle <strong>{selectedSize}</strong>
          </p>
        )}

        <AddToCartButton product={product} />

        <div className="mt-6">
          <h2 className="font-semibold mb-2 text-center">Código QR del producto</h2>
          <div className="flex justify-center items-center bg-white p-4 rounded-md shadow-md w-fit mx-auto">
            <QRCode value={product.documentId} size={128} />
          </div>
        </div>
      </div>
    </div>
  )
}
