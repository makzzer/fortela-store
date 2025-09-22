import Hero from "@/components/home/hero"
import FeaturedProducts from "@/components/home/featured-products"
import CategorySection from "@/components/home/category-section"
import Testimonials from "@/components/home/testimonials"

// app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  // Siempre que entren a "/", los mando a /admin
  redirect("/admin");
}
