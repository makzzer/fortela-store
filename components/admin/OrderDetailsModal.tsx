"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type VariantePorTalle = { talle: string; precio?: number };

interface ItemRow {
  id: number;
  cantidad: number;
  talle: string;
  nombre: string;
  descripcion: string;
  precioUnit: number; // precio que mostramos (unitario por talle)
  subtotal: number;   // importe de la línea
}

interface Props {
  documentId: string;
  children?: ReactNode; // 👈 trigger opcional (asChild)
}

const money = (n: number) => `$${n.toFixed(2)}`;

export default function OrderDetailsModal({ documentId, children }: Props) {
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    // Traemos solo los ítems de la orden y populamos variantes por talle
    const url = new URL(
      "https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados"
    );
    url.searchParams.set(
      "filters[fortela_orden][documentId][$eq]",
      documentId
    );
    url.searchParams.set(
      "populate[fortela_producto][populate]",
      "variantesPorTalle"
    );
    url.searchParams.set("pagination[limit]", "100");

    fetch(url.toString(), { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.data) {
          throw new Error(json.error?.message || "Error al obtener productos");
        }

        const mapped: ItemRow[] = (json.data as any[]).map((item) => {
          const cantidad = Number(item.cantidad ?? 0);
          const talle: string = item.talle ?? "-";

          const producto = item.fortela_producto ?? {};
          const variantes: VariantePorTalle[] =
            producto?.variantesPorTalle ?? [];

          // 1) preferimos lo guardado en el ítem
          let precioUnit: number | undefined =
            typeof item.precio_unitario === "number"
              ? Number(item.precio_unitario)
              : undefined;

          // 2) si no hay, buscamos precio por talle en la variante
          if (typeof precioUnit !== "number") {
            const v = variantes.find((vv) => vv.talle === talle);
            if (v && typeof v.precio === "number") {
              precioUnit = Number(v.precio);
            }
          }

          // 3) último recurso: precio base del producto
          if (typeof precioUnit !== "number") {
            precioUnit = Number(producto?.precio ?? 0);
          }

          // Subtotal: usamos el importe guardado si existe
          const subtotal =
            typeof item.importe === "number"
              ? Number(item.importe)
              : precioUnit * cantidad;

          return {
            id: item.id,
            cantidad,
            talle,
            nombre: producto?.nombre || "Producto",
            descripcion: producto?.descripcion || "",
            precioUnit,
            subtotal,
          };
        });

        setRows(mapped);
      })
      .catch((err) => {
        console.error("❌ ERROR FETCHING ITEMS:", err);
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, [open, documentId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start font-normal gap-2"
          >
            <Eye className="w-4 h-4 mr-2" /> Ver Detalles
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl w-full">
        <DialogTitle className="text-xl font-bold">
          Productos de la Orden
        </DialogTitle>

        {loading ? (
          <p className="text-muted-foreground text-sm mt-2">
            Cargando productos...
          </p>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm mt-2">
            No se encontraron productos para esta orden.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Producto</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-center p-2">Talle</th>
                  <th className="text-center p-2">Cantidad</th>
                  <th className="text-right p-2">Precio</th>
                  <th className="text-right p-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="p-2">{r.nombre}</td>
                    <td className="p-2">{r.descripcion}</td>
                    <td className="p-2 text-center">{r.talle}</td>
                    <td className="p-2 text-center">{r.cantidad}</td>
                    <td className="p-2 text-right">{money(r.precioUnit)}</td>
                    <td className="p-2 text-right">{money(r.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
