import Image from "next/image"
import { notFound } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AddToCartButton from "./add-to-cart-button"

// This would be fetched from the API in a real app
const getProduct = async (id: string) => {
  const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${id}?populate=*`, {
    next: { revalidate: 60 }, // opcional para ISR
  });

  if (!res.ok) return null;

  const { data } = await res.json();

  return {
    id: data.id,
    name: data.nombre,
    description: data.descripcion,
    price: data.precio,
    image: data.imagen?.data?.attributes?.url
      ? `https://vps-4937880-x.dattaweb.com${data.imagen.data.attributes.url}`
      : "/placeholder.svg",
    category: data.genero || "unisex",
    sizes: data.talles || [],
    details: {
      material: "65% Polyester, 35% Cotton",
      care: "Machine wash cold, tumble dry low",
      features: [
        "Wrinkle-resistant fabric",
        "Reinforced seams for durability",
        "Easy-care fabric that maintains shape after washing",
        "Designed for comfort and all-day wear",
      ],
    },
  };
};


export default async function ProductDetails({ id }: { id: string }) {
  const product = await getProduct(id)

  if (!product) {
    notFound()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="aspect-square relative">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          fill
          className="object-cover rounded-lg"
          priority
        />
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-2xl font-semibold mt-2">${product.price.toFixed(2)}</p>
        </div>

        <p className="text-muted-foreground">{product.description}</p>

        <AddToCartButton product={product} />

        <Tabs defaultValue="details" className="mt-8">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="sizing">Sizing</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium">Material</h4>
              <p className="text-sm text-muted-foreground">{product.details.material}</p>
            </div>
            <div>
              <h4 className="font-medium">Care Instructions</h4>
              <p className="text-sm text-muted-foreground">{product.details.care}</p>
            </div>
            <div>
              <h4 className="font-medium">Features</h4>
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mt-2">
                {product.details.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="sizing" className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Our uniforms are designed to provide a comfortable fit. Please refer to the size chart below to find your
              perfect size.
            </p>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left">Size</th>
                    <th className="px-4 py-2 text-left">Chest (inches)</th>
                    <th className="px-4 py-2 text-left">Waist (inches)</th>
                    <th className="px-4 py-2 text-left">Height (inches)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-4 py-2">S</td>
                    <td className="px-4 py-2">34-36</td>
                    <td className="px-4 py-2">28-30</td>
                    <td className="px-4 py-2">65-67</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2">M</td>
                    <td className="px-4 py-2">38-40</td>
                    <td className="px-4 py-2">32-34</td>
                    <td className="px-4 py-2">68-70</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2">L</td>
                    <td className="px-4 py-2">42-44</td>
                    <td className="px-4 py-2">36-38</td>
                    <td className="px-4 py-2">71-73</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2">XL</td>
                    <td className="px-4 py-2">46-48</td>
                    <td className="px-4 py-2">40-42</td>
                    <td className="px-4 py-2">74-76</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="shipping" className="mt-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Delivery Options</h4>
                <p className="text-sm text-muted-foreground">
                  We offer standard shipping (3-5 business days) and express shipping (1-2 business days) options.
                </p>
              </div>
              <div>
                <h4 className="font-medium">Returns</h4>
                <p className="text-sm text-muted-foreground">
                  If you're not completely satisfied with your purchase, you can return it within 30 days for a full
                  refund.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
