import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AddToCartButton from "./add-to-cart-button"

const getProducts = async () => {
  const res = await fetch("https://vps-4937880-x.dattaweb.com/api/productos", {
    next: { revalidate: 60 },
  })

  if (!res.ok) throw new Error("Error fetching productos")

  const data = await res.json()

  return data.data.map((item: any) => ({
    documentId: item.documentId,
    name: item.nombre,
    description: item.descripcion,
    price: item.precio,
    image: "/bana.webp", // reemplazá si usás media real
    category: item.genero || "unisex",
    sizes: item.talles || [],
  }))
}

export default async function ProductCatalog() {
  const products = await getProducts()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products
        .filter((product: any) => !!product.documentId) // evitar null/undefined
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
