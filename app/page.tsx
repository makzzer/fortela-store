import Hero from "@/components/home/hero"
import FeaturedProducts from "@/components/home/featured-products"
import CategorySection from "@/components/home/category-section"
import Testimonials from "@/components/home/testimonials"

import { redirect } from "next/navigation"



export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <Testimonials />
    </div>
  )
}
