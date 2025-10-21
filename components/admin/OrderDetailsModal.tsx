"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  colegio: string;        // 👈 ahora lo traemos del ítem
  nombre: string;
  descripcion: string;
  precioUnit: number;
}

interface Props {
  documentId: string;
  children?: ReactNode; // trigger opcional (asChild)
}

const money = (n: number) => `$${n.toFixed(2)}`;

export default function OrderDetailsModal({ documentId, children }: Props) {
  const [rows, setRows] = useState<ItemRow[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const total = useMemo(
    () => rows.reduce((acc, r) => acc + r.precioUnit * r.cantidad, 0),
    [rows]
  );

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    // Ítems de la orden (por documentId), con producto y variantes por talle
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
          const colegio: string = item.colegio ?? "-";   // 👈 toma el colegio guardado en el ítem

          const producto = item.fortela_producto ?? {};
          const variantes: VariantePorTalle[] = producto?.variantesPorTalle ?? [];

          // 1) Preferir precio guardado en el ítem
          let precioUnit: number | undefined =
            typeof item.precio_unitario === "number"
              ? Number(item.precio_unitario)
              : undefined;

          // 2) Si no hay, buscar precio por talle en la variante
          if (typeof precioUnit !== "number") {
            const v = variantes.find((vv) => vv.talle === talle);
            if (v && typeof v.precio === "number") {
              precioUnit = Number(v.precio);
            }
          }

          // 3) Último recurso: precio base del producto
          if (typeof precioUnit !== "number") {
            precioUnit = Number(producto?.precio ?? 0);
          }

          return {
            id: item.id,
            cantidad,
            talle,
            colegio,                                    // 👈 incluir en la fila
            nombre: producto?.nombre || "Producto",
            descripcion: producto?.descripcion || "",
            precioUnit,
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

      <DialogContent className="max-w-2xl w-full rounded-2xl shadow-2xl p-6">
        <DialogTitle className="text-xl font-semibold tracking-tight">
          Productos de la Orden
        </DialogTitle>

        {loading ? (
          <div className="mt-4 space-y-2">
            <div className="h-8 rounded-md bg-muted animate-pulse" />
            <div className="h-8 rounded-md bg-muted animate-pulse" />
            <div className="h-8 rounded-md bg-muted animate-pulse" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-muted-foreground text-sm mt-3">
            No se encontraron productos para esta orden.
          </p>
        ) : (
          <div className="mt-4 rounded-xl border bg-card">
            <div className="max-h-[60vh] overflow-auto rounded-xl">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/70 backdrop-blur supports-[backdrop-filter]:bg-muted/60">
                  <tr>
                    <th className="text-left p-3">Producto</th>
                    <th className="text-left p-3">Descripción</th>
                    <th className="text-left p-3">Colegio</th>
                    <th className="text-center p-3">Talle</th>
                    <th className="text-center p-3">Cantidad</th>
                    <th className="text-right p-3">Precio unit.</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:nth-child(even)]:bg-muted/30">
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="p-3">{r.nombre}</td>
                      <td className="p-3 text-muted-foreground">{r.descripcion}</td>
                      <td className="p-3">{r.colegio}</td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                          {r.talle}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium">
                          {r.cantidad}
                        </span>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {money(r.precioUnit)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-semibold">
                    <td className="p-3 text-right" colSpan={5}>
                      Total
                    </td>
                    <td className="p-3 text-right text-base">{money(total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
