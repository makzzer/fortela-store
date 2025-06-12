import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

// This would be fetched from the API in a real app
const getFeaturedProducts = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300))

  return Array(4)
    .fill(0)
    .map((_, i) => ({
      id: `${i + 1}`,
      name: `Featured Uniform Item ${i + 1}`,
      description: "High-quality school uniform item",
      price: Math.floor(Math.random() * 50) + 10,
      image: "/nike.jpeg",
    }))
}

export default async function FeaturedProducts() {
  const products = await getFeaturedProducts()

  return (
    <section className="py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Featured Products</h2>
        <Button variant="outline" asChild>
          <Link href="/shop">View All</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <Link href={`/shop/${product.id}`} className="block">
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
            </Link>
            <CardFooter className="p-4 pt-0">
              <Button className="w-full" asChild>
                <Link href={`/shop/${product.id}`}>View Details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
