"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CambioTicketPreview from "./CambioTicketPreview";
import { Download, Printer, Share2, X } from "lucide-react";

interface Item {
  id: number;
  cantidad: number;
  talle: string;
  producto: { nombre: string; descripcion: string; precio: number };
}

interface TicketCambioModalProps {
  documentId: string;
  fecha: string;
  /** si querés abrirlo programáticamente (POS) */
  initialOpen?: boolean;
  /** opcional: personalizar el trigger externo si lo usás en listados */
  triggerClassName?: string;
  triggerLabel?: string;
}

export default function TicketCambioModal({
  documentId,
  fecha,
  initialOpen = false,
  triggerClassName,
  triggerLabel = "Ver ticket de cambio",
}: TicketCambioModalProps) {
  const [open, setOpen] = useState(initialOpen);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(initialOpen), [initialOpen]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados?populate=*")
      .then((r) => r.json())
      .then((json) => {
        const filtered = json.data?.filter(
          (it: any) => it.fortela_orden?.documentId === documentId
        );
        const mapped: Item[] = filtered.map((it: any) => ({
          id: it.id,
          cantidad: it.cantidad,
          talle: it.talle,
          producto: {
            nombre: it.fortela_producto?.nombre || "",
            descripcion: it.fortela_producto?.descripcion || "",
            precio: it.fortela_producto?.precio || 0,
          },
        }));
        setItems(mapped);
      })
      .finally(() => setLoading(false));
  }, [open, documentId]);

  // ---- Helpers PDF / Share / Print ----
  const buildPdfFile = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const node = ticketRef.current!;
    const canvas = await html2canvas(node, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, w, h);
    const blob = pdf.output("blob");
    return new File([blob], `ticket-${documentId}.pdf`, { type: "application/pdf" });
  };

  const downloadPdf = async () => {
    const f = await buildPdfFile();
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const shareWhatsapp = async () => {
    try {
      const f = await buildPdfFile();
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [f] })) {
        await nav.share({
          files: [f],
          title: `Ticket ${documentId}`,
          text: `Ticket de cambio - Orden ${documentId}`,
        });
      } else {
        // fallback: descarga + abre WhatsApp con texto
        await downloadPdf();
        const msg = `Ticket de cambio - Orden ${documentId}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const printPdf = async () => {
    const f = await buildPdfFile();
    const url = URL.createObjectURL(f);
    // abrir en nueva pestaña e invocar print
    const w = window.open(url, "_blank");
    // en algunos navegadores se necesita un pequeño delay
    setTimeout(() => {
      try {
        w?.focus();
        w?.print();
      } catch { }
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger (cuando lo usás embebido en cards/listas) */}
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          className={triggerClassName ?? "px-3 h-9 rounded-full"}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="
    w-[min(100vw-1rem,900px)]
    max-h-[90dvh] sm:max-h-[85vh]
    p-0
    flex flex-col
  "
      >
        {/* Header */}
        <DialogHeader
          className="
      bg-background/90 backdrop-blur border-b
      px-4 py-2
      sticky top-0 z-10
    "
        >
          {/* ... tu título + botón cerrar ... */}
        </DialogHeader>

        {/* 2) Body: ahora sí toma el alto restante y scrollea */}
        <div className="flex-1 overflow-auto px-4 pb-3 pt-2 bg-white">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando ticket…</p>
          ) : (
            <div ref={ticketRef}>
              <CambioTicketPreview items={items} documentId={documentId} fecha={fecha} />
            </div>
          )}
        </div>

        {/* 3) Footer: ya no sticky; siempre alcanzable al final del scroll */}
        <div className="border-t bg-background px-4 py-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            onClick={shareWhatsapp}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartir por WhatsApp
          </Button>
          <Button onClick={downloadPdf} variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button onClick={printPdf} variant="outline" className="w-full sm:w-auto">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={() => setOpen(false)} variant="secondary" className="w-full sm:w-auto">
            Cerrar
          </Button>
        </div>
      </DialogContent>



    </Dialog>
  );
}
