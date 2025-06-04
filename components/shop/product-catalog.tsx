"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AddToCartButton from "./add-to-cart-button"

const getProducts = async () => {
  const res = await fetch("https://vps-4937880-x.dattaweb.com/api/productos?populate=*", {
    next: { revalidate: 60 },
  })

  if (!res.ok) throw new Error("Error al obtener productos")

  const data = await res.json()

  return data.data.map((item: any) => {
    const variantes = item.variantesPorTalle || []
    const totalStock = variantes.reduce((sum: number, v: any) => sum + (v.cantidad || 0), 0)
    const lowestPrice = variantes.reduce(
      (min: number, v: any) => (v.precio < min ? v.precio : min),
      variantes[0]?.precio || 0
    )
    const talles = variantes.map((v: any) => v.talle)

    return {
      documentId: item.documentId,
      id: item.id,
      name: item.nombre,
      description: item.descripcion,
      price: lowestPrice,
      stock: totalStock,
      image: "/bana.webp",
      category: item.genero || "unisex",
      sizes: talles,
      variantesPorTalle: variantes,
    }
  })
}

export default function ProductCatalog() {
  const searchParams = useSearchParams()
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchAndFilter = async () => {
      setLoading(true)
      const products = await getProducts()

      const generoFilter = searchParams.get("genero")
      const talleFilter = searchParams.get("talle")
      const searchFilter = searchParams.get("search")?.toLowerCase() || ""

      const filtered = products.filter((product: any) => {
        const matchGenero = generoFilter ? product.category === generoFilter : true
        const matchTalle = talleFilter ? product.sizes.includes(talleFilter) : true
        const matchSearch = searchFilter ? product.name.toLowerCase().includes(searchFilter) : true
        return matchGenero && matchTalle && matchSearch
      })

      setFilteredProducts(filtered)
      setLoading(false)
    }

    fetchAndFilter()
  }, [searchParams])

  if (loading) {
    return <p className="text-center py-8 text-muted-foreground">Cargando productos...</p>
  }

  if (filteredProducts.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        No se encontraron productos que coincidan con tu búsqueda.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts.map((product: any) => {
        const selectedSize = selectedSizes[product.documentId] || ""

        return (
          <Card key={product.documentId} className="overflow-hidden">
            <div className="aspect-square relative">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-medium text-lg mb-1">{product.name}</h3>
              <p className="text-muted-foreground text-sm mb-2">{product.description}</p>

              <div className="flex flex-wrap gap-2 mb-2">
                {product.variantesPorTalle.map((v: any) => (
                  <button
                    key={v.talle}
                    onClick={() =>
                      setSelectedSizes((prev) => ({
                        ...prev,
                        [product.documentId]: v.talle,
                      }))
                    }
                    className={`px-3 py-1 border rounded-full text-sm transition-colors ${
                      selectedSize === v.talle
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-gray-100"
                    }`}
                  >
                    {v.talle}
                  </button>
                ))}
              </div>

              {selectedSize && (
                <div className="text-sm bg-gray-50 rounded-md p-2 border">
                  {(() => {
                    const match = product.variantesPorTalle.find(
                      (v: any) => v.talle === selectedSize
                    )
                    return (
                      <>
                        <p className="text-gray-700">
                          Stock disponible: <span className="font-medium">{match?.cantidad}</span>
                        </p>
                        <p className="text-gray-700">
                          Precio:{" "}
                          <span className="font-medium">
                            ${match?.precio?.toFixed(2) ?? product.price}
                          </span>
                        </p>
                      </>
                    )
                  })()}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
              <AddToCartButton
                product={{
                  ...product,
                  size: selectedSize,
                }}
                showSelect={false} // ⛔ oculta el selector extra
              />
              <Link href={`/shop/${product.documentId}`} className="w-full">
                <Button variant="outline" className="w-full">
                  Ver producto
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
