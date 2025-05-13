import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import AddToCartButton from "./add-to-cart-button"

// This would be fetched from the API in a real app
const getProducts = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return Array(12)
    .fill(0)
    .map((_, i) => ({
      id: `${i + 1}`,
      name: `School Uniform Item ${i + 1}`,
      description: "High-quality school uniform item",
      price: Math.floor(Math.random() * 50) + 10,
      image: "/placeholder.svg",
      category: ["boys", "girls", "accessories"][Math.floor(Math.random() * 3)],
      sizes: ["S", "M", "L", "XL"],
    }))
}

export default async function ProductCatalog() {
  const products = await getProducts()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="aspect-square relative">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
          </div>
          <CardContent className="p-4">
            <Link href={`/shop/${product.id}`} className="block">
              <h3 className="font-medium text-lg mb-1 hover:underline">{product.name}</h3>
            </Link>
            <p className="text-muted-foreground text-sm mb-2">{product.description}</p>
            <p className="font-semibold">${product.price.toFixed(2)}</p>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <AddToCartButton product={product} />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
