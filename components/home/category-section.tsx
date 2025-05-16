import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const categories = [
  {
    id: "boys",
    name: "Boys Uniforms",
    image: "/bana.webp",
    description: "Comfortable and durable uniforms for boys of all ages",
  },
  {
    id: "girls",
    name: "Girls Uniforms",
    image: "/bana.webp",
    description: "Stylish and practical uniforms for girls of all ages",
  },
  {
    id: "accessories",
    name: "Accessories",
    image: "/bana.webp",
    description: "Complete the look with our range of school accessories",
  },
]

export default function CategorySection() {
  return (
    <section className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Browse our collection of high-quality school uniforms and accessories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="overflow-hidden">
            <div className="aspect-video relative">
              <Image src={category.image || "/placeholder.svg"} alt={category.name} fill className="object-cover" />
            </div>
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
              <p className="text-muted-foreground mb-4">{category.description}</p>
              <Button asChild>
                <Link href={`/shop?category=${category.id}`}>Shop Now</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
