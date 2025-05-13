import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

// This would be fetched from the API in a real app
const getRelatedProducts = async (id: string) => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Mock related products
  return Array(4)
    .fill(0)
    .map((_, i) => ({
      id: `${Number.parseInt(id) + i + 1}`,
      name: `School Uniform Item ${Number.parseInt(id) + i + 1}`,
      price: Math.floor(Math.random() * 50) + 10,
      image: "/placeholder.svg",
    }))
}

export default async function RelatedProducts({ id }: { id: string }) {
  const products = await getRelatedProducts(id)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <Link href={`/shop/${product.id}`}>
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
