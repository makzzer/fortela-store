"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface Item {
  id: number;
  cantidad: number;
  talle: string;
  producto: {
    nombre: string;
    descripcion: string;
    precio: number;
  };
}

interface Props {
  documentId: string;
}

export default function OrderDetailsModal({ documentId }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);

    const url = "https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados?populate=*";
    console.log("🔎 FETCH URL:", url);

    fetch(url)
      .then(async (res) => {
        const json = await res.json();
        console.log("📥 RESPONSE:", json);

        if (!res.ok || !json.data) {
          throw new Error(json.error?.message || "Error al obtener productos");
        }

        const filtered = json.data.filter(
          (item: any) => item.fortela_orden?.documentId === documentId
        );

        const mapped = filtered.map((item: any) => ({
          id: item.id,
          cantidad: item.cantidad,
          talle: item.talle,
          producto: {
            nombre: item.fortela_producto?.nombre || "",
            descripcion: item.fortela_producto?.descripcion || "",
            precio: item.fortela_producto?.precio || 0,
          },
        }));

        setItems(mapped);
      })
      .catch((err) => {
        console.error("❌ ERROR FETCHING ITEMS:", err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [open, documentId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
                <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start font-normal gap-2"
        >
          <Eye className="w-4 h-4 mr-2" /> Ver Detalles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full">
        <DialogTitle className="text-xl font-bold">Productos de la Orden</DialogTitle>

        {loading ? (
          <p className="text-muted-foreground text-sm mt-2">Cargando productos...</p>
        ) : items.length === 0 ? (
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
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.producto.nombre}</td>
                    <td className="p-2">{item.producto.descripcion}</td>
                    <td className="p-2 text-center">{item.talle}</td>
                    <td className="p-2 text-center">{item.cantidad}</td>
                    <td className="p-2 text-right">
                      ${item.producto.precio.toFixed(2)}
                    </td>
                    <td className="p-2 text-right">
                      ${(item.producto.precio * item.cantidad).toFixed(2)}
                    </td>
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