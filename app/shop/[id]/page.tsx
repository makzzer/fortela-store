import { Suspense } from "react"
import { notFound } from "next/navigation"
import ProductDetails from "@/components/shop/product-details"
import RelatedProducts from "@/components/shop/related-products"
import { Skeleton } from "@/components/ui/skeleton"

interface ProductPageProps {
  params: {
    id: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = params

  if (!id) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<ProductDetailsSkeleton />}>
        <ProductDetails id={id} />
      </Suspense>

      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-6">You may also like</h2>
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <RelatedProducts id={id} />
        </Suspense>
      </div>
    </div>
  )
}

function ProductDetailsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Skeleton className="h-96 w-full" />
      <div>
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/4 mb-6" />
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}

function RelatedProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array(4)
        .fill(0)
        .map((_, i) => (
          <div key={i}>
            <Skeleton className="h-48 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
    </div>
  )
}
