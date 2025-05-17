import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface RelatedProduct {
  documentId: string
  name: string
  price: number
  image: string
}

// Simulación de API (reemplazá esto con fetch real si lo necesitás)
const getRelatedProducts = async (id: string): Promise<RelatedProduct[]> => {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return Array(4)
    .fill(0)
    .map((_, i) => ({
      documentId: `related-${id}-${i}`, // clave única garantizada
      name: `School Uniform Item ${i + 1}`,
      price: Math.floor(Math.random() * 50) + 10,
      image: "/placeholder.svg",
    }))
}

export default async function RelatedProducts({ id }: { id: string }) {
  const products = await getRelatedProducts(id)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.documentId} className="overflow-hidden">
          <Link href={`/shop/${product.documentId}`}>
            <div className="aspect-square relative">
              <Image
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                fill
                className="object-cover transition-transform hover:scale-105"
              />
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm truncate">{product.name}</h3>
              <p className="font-semibold text-sm">${product.price.toFixed(2)}</p>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  )
}
