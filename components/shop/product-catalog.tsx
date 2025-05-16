import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import AddToCartButton from "./add-to-cart-button"

// This would be fetched from the API in a real app
const getProducts = async () => {
  const res = await fetch("https://vps-4937880-x.dattaweb.com/api/productos", {
    next: { revalidate: 60 }, // habilita caching ISR
  });

  if (!res.ok) throw new Error("Error fetching productos");

  const data = await res.json();

  return data.data.map((item: any) => ({
    documentId: item.documentId, // usá esto para fetch individuales
    name: item.nombre,
    description: item.descripcion,
    price: item.precio,
    image: "/bana.webp", // reemplazá esto si usás media en Strapi
    category: item.genero || "unisex",
    sizes: item.talles || [],
  }));
};


export default async function ProductCatalog() {
  const products = await getProducts()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product:any) => (
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
            <Link href={`/shop/${product.documentId}`} className="block">
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
