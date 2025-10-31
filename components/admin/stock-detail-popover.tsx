"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

type Variante = {
  talle: string;
  precio: number;
  cantidad: number;
};

type GrupoColegio = {
  colegio: string;
  variantesPorTalles: Variante[];
};

interface Props {
  variantes: Variante[] | GrupoColegio[];
  title?: string;
  subtitle?: string;
}

export default function StockDetailPopover({
  variantes,
  title = "Detalle de stock",
  subtitle,
}: Props) {
  const [open, setOpen] = useState(false);

  // type guard simple
  const isGrouped =
    Array.isArray(variantes) &&
    variantes.length > 0 &&
    typeof (variantes as any)[0] === "object" &&
    "variantesPorTalles" in (variantes as any)[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          Ver detalle
          <Info className="w-4 h-4" />
        </Button>
      </DialogTrigger>

      {/* 👇 Scroll del modal puesto acá */}
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </DialogHeader>

        {/* sin max-h ni overflow internos; el que scrollea es el DialogContent */}
        <div className="px-5 py-4 space-y-4">
          {isGrouped ? (
            (variantes as GrupoColegio[]).map((grupo) => (
              <div
                key={grupo.colegio}
                className="rounded-xl border bg-card text-card-foreground shadow-sm"
              >
                <div className="px-4 py-2 text-sm font-semibold border-b">
                  {grupo.colegio}
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2">Talle</th>
                      <th className="text-left px-4 py-2">Precio</th>
                      <th className="text-left px-4 py-2">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.variantesPorTalles.map((v) => (
                      <tr key={`${grupo.colegio}-${v.talle}`} className="border-t">
                        <td className="px-4 py-2">{v.talle}</td>
                        <td className="px-4 py-2">
                          {typeof v.precio === "number"
                            ? `$${v.precio.toLocaleString("es-AR")}`
                            : v.precio}
                        </td>
                        <td className="px-4 py-2">
                          {v.cantidad} <span className="text-muted-foreground">u.</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2">Talle</th>
                  <th className="text-left px-4 py-2">Precio</th>
                  <th className="text-left px-4 py-2">Stock</th>
                </tr>
              </thead>
              <tbody>
                {(variantes as Variante[]).map((v) => (
                  <tr key={v.talle} className="border-t">
                    <td className="px-4 py-2">{v.talle}</td>
                    <td className="px-4 py-2">
                      {typeof v.precio === "number"
                        ? `$${v.precio.toLocaleString("es-AR")}`
                        : v.precio}
                    </td>
                    <td className="px-4 py-2">
                      {v.cantidad} <span className="text-muted-foreground">u.</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
