"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductsTable from "@/components/admin/products-table";
import { Plus, Search } from "lucide-react";

export default function ProductsPage() {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Productos</h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-black text-white px-4 py-2 text-sm font-medium shadow hover:bg-neutral-800 transition"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </Link>

      </div>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar productos..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button variant="outline">Filtros</Button>
      </div>

      <ProductsTable filtro={busqueda} />
    </div>
  );
}
