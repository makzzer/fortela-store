import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-r from-[#f0f4ff] to-[#ffffff] rounded-xl shadow-sm">
      <div className="container relative z-10 text-center max-w-3xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-gray-900 mb-6">
          Uniformes escolares con estilo y comodidad
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-10">
          Fortela ofrece uniformes de alta calidad que cumplen con los requisitos escolares, brindando confort y estilo para que los estudiantes luzcan impecables todos los días.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="px-8 py-4 text-lg shadow-md" asChild>
            <Link href="/shop">Ver productos</Link>
          </Button>
          <Button size="lg" variant="outline" className="px-8 py-4 text-lg" asChild>
            <Link href="/about">Conocé más</Link>
          </Button>
        </div>
      </div>
      <div className="absolute inset-0 opacity-5 bg-[url('/grid.svg')] bg-cover bg-center pointer-events-none" />
    </section>
  )
}
