"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AddToCartButton from "./add-to-cart-button"

const getProducts = async () => {
  const res = await fetch("https://vps-4937880-x.dattaweb.com/api/productos", {
    next: { revalidate: 60 },
  })

  if (!res.ok) throw new Error("Error al obtener productos")

  const data = await res.json()

  return data.data.map((item: any) => ({
    documentId: item.documentId,
    name: item.nombre,
    description: item.descripcion,
    price: item.precio,
    stock: item.stock ?? 0,
    image: "/bana.webp", // reemplazá si usás media real
    category: item.genero || "unisex",
    sizes: item.talles || [],
  }))
}

export default function ProductCatalog() {
  const searchParams = useSearchParams()
  const [filteredProducts, setFilteredProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
    return <p className="text-center py-8 text-muted-foreground">No se encontraron productos que coincidan con tu búsqueda.</p>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts
        .filter((product: any) => !!product.documentId)
        .map((product: any) => (
          <Card key={product.documentId ?? product.name} className="overflow-hidden">
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
              <p className="font-semibold">${product.price.toFixed(2)}</p>

              <p className={`text-sm mt-1 ${product.stock <= 5 ? "text-red-500 font-medium" : "text-green-600"}`}>
                {product.stock <= 5
                  ? `¡Quedan solo ${product.stock} unidad${product.stock === 1 ? "" : "es"}!`
                  : `Quedan ${product.stock} unidades`}
              </p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex flex-col gap-2">
              <AddToCartButton product={product} />
              <Link href={`/shop/${product.documentId}`} className="w-full">
                <Button variant="outline" className="w-full">Ver producto</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
    </div>
  )
}
