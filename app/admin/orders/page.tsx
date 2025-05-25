"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrdersTable from "@/components/admin/orders-table";
import { Search, Filter } from "lucide-react";

export default function OrdersPage() {
  const [busqueda, setBusqueda] = useState("");

  return (
    <div className="w-full px-4 sm:px-0">
      <h1 className="text-3xl font-bold mb-8">Órdenes</h1>

      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar órdenes..."
            className="pl-8"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
      </div>

      <OrdersTable filtro={busqueda} />
    </div>
  );
}
