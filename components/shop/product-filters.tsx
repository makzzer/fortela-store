"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const generos = [
  { id: "niño", label: "Niño" },
  { id: "niña", label: "Niña" },
  { id: "unisex", label: "Unisex" },
]

const talles = [
  { id: "XS", label: "XS" },
  { id: "S", label: "S" },
  { id: "M", label: "M" },
  { id: "L", label: "L" },
  { id: "XL", label: "XL" },
]

export default function ProductFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedGeneros, setSelectedGeneros] = useState<string[]>(searchParams.get("genero")?.split(",") || [])
  const [selectedTalles, setSelectedTalles] = useState<string[]>(searchParams.get("talle")?.split(",") || [])

  const handleGeneroChange = (genero: string, checked: boolean) => {
    setSelectedGeneros((prev) => (checked ? [...prev, genero] : prev.filter((g) => g !== genero)))
  }

  const handleTalleChange = (talle: string, checked: boolean) => {
    setSelectedTalles((prev) => (checked ? [...prev, talle] : prev.filter((t) => t !== talle)))
  }

  const applyFilters = () => {
    const params = new URLSearchParams()

    if (selectedGeneros.length > 0) {
      params.set("genero", selectedGeneros.join(","))
    }

    if (selectedTalles.length > 0) {
      params.set("talle", selectedTalles.join(","))
    }

    router.push(`/shop?${params.toString()}`)
  }

  const clearFilters = () => {
    setSelectedGeneros([])
    setSelectedTalles([])
    router.push("/shop")
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Filtros</h3>

        <Accordion type="multiple" defaultValue={[]} className="w-full">
          <AccordionItem value="genero">
            <AccordionTrigger>Sexo</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {generos.map((g) => (
                  <div key={g.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`genero-${g.id}`}
                      checked={selectedGeneros.includes(g.id)}
                      onCheckedChange={(checked) => handleGeneroChange(g.id, checked as boolean)}
                    />
                    <label htmlFor={`genero-${g.id}`} className="text-sm leading-none">
                      {g.label}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="talle">
            <AccordionTrigger>Talle</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {talles.map((t) => (
                  <div key={t.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`talle-${t.id}`}
                      checked={selectedTalles.includes(t.id)}
                      onCheckedChange={(checked) => handleTalleChange(t.id, checked as boolean)}
                    />
                    <label htmlFor={`talle-${t.id}`} className="text-sm leading-none">
                      {t.label}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="colegio">
            <AccordionTrigger>Colegio</AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground">(Próximamente)</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={applyFilters}>Aplicar filtros</Button>
        <Button variant="outline" onClick={clearFilters}>Limpiar</Button>
      </div>
    </div>
  )
}
