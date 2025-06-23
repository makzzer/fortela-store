"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CambioTicketPreview from "./CambioTicketPreview";
import { FileText } from "lucide-react"; // 👈 Usa un ícono consistente si querés

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
  fecha: string;
}

export default function TicketCambioModal({ documentId, fecha }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    fetch("https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados?populate=*")
      .then((res) => res.json())
      .then((json) => {
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
      .finally(() => setLoading(false));
  }, [open, documentId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start font-normal gap-2 flex items-center"
        >
          <FileText className="w-4 h-4" /> {/* o reemplazá por <span>🧾</span> */}
          Ver Ticket de cambio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl w-full">
        <DialogTitle className="text-base font-semibold">Ticket de Cambio</DialogTitle>
        {loading ? (
          <p className="text-sm text-muted-foreground mt-2">Cargando ticket...</p>
        ) : (
          <CambioTicketPreview items={items} documentId={documentId} fecha={fecha} />
        )}
      </DialogContent>
    </Dialog>
  );
}