import { Suspense } from "react"
import ProductCatalog from "@/components/shop/product-catalog"
import ProductFilters from "@/components/shop/product-filters"
import SearchBar from "@/components/shop/search-bar"
import { Skeleton } from "@/components/ui/skeleton"


export default function ShopPage() {


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tienda de Uniformes</h1>

      <SearchBar />

      <div className="flex flex-col md:flex-row gap-6 mt-6">
        <div className="w-full md:w-64 shrink-0">
          <ProductFilters />
        </div>

        <div className="flex-1">
          <Suspense fallback={<ProductCatalogSkeleton />}>
            <ProductCatalog />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function ProductCatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array(6)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
    </div>
  )
}
