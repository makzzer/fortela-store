"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OrderDetailsModal from "./OrderDetailsModal";

interface Order {
  id: number;
  total: number;
  date: string;
  tipo_venta: string;
  documentId: string;
}

interface Props {
  filtro: string;
}

const PAGE_SIZE = 20;

export default function OrdersTable({ filtro }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1); // 1-indexed
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch(
        "https://vps-4937880-x.dattaweb.com/api/fortela-ordenes?populate=fortela_cliente",
        { cache: "no-store" }
      );
      const data = await res.json();
      const formatted: Order[] = (data?.data ?? []).map((order: any) => ({
        id: order.id,
        documentId: order.documentId,
        total: Number(order.total ?? 0),
        date: new Date(order.fecha).toLocaleDateString(),
        tipo_venta: order.tipo_venta ?? "online",
      }));
      setOrders(formatted);
    };
    fetchOrders();
  }, []);

  // Filtro
  const filtroLc = filtro.toLowerCase().trim();
  const ordenesFiltradas = useMemo(() => {
    if (!filtroLc) return orders;
    return orders.filter((o) => `ORD-${o.id}`.toLowerCase().includes(filtroLc));
  }, [orders, filtroLc]);

  // Paginación
  const pageCount = Math.max(1, Math.ceil(ordenesFiltradas.length / PAGE_SIZE));

  // Volver a la primera página cuando cambia el filtro
  useEffect(() => setPage(1), [filtroLc]);

  // Clamp si el filtro reduce páginas
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  // Scroll al top en cada cambio de página
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const visibles = ordenesFiltradas.slice(startIdx, endIdx);

  const showingFrom = ordenesFiltradas.length ? startIdx + 1 : 0;
  const showingTo = Math.min(endIdx, ordenesFiltradas.length);

  // Números de página con elipsis
  const pageNumbers = useMemo(() => {
    const nums: (number | string)[] = [];
    const delta = 2;
    let last: number | undefined;
    for (let i = 1; i <= pageCount; i++) {
      if (i === 1 || i === pageCount || (i >= page - delta && i <= page + delta)) {
        if (last && i - last > 1) nums.push(i - last === 2 ? last + 1 : "…");
        nums.push(i);
        last = i;
      }
    }
    return nums;
  }, [page, pageCount]);

  const verTicketPDF = async (order: Order) => {
    const newTab = window.open("", "_blank");
    try {
      const res = await fetch("/api/ticket-cambio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: `ORD-${order.id}`,
          fecha: order.date,
          cliente: "Consumidor Final",
          ordenId: order.documentId,
          total: order.total,
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "No se pudo generar el PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (newTab) newTab.location.href = url;
      else window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error(e);
      if (newTab) newTab.close();
      alert("Error al generar el ticket. Probá de nuevo.");
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div ref={topRef} />

      {/* Desktop / Tablet */}
      <div className="hidden sm:block">
        <Table className="min-w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>ID Compra</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visibles.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium whitespace-nowrap">
                  ORD-{order.id}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {order.documentId.slice(0,5)}
                </TableCell>
                <TableCell className="whitespace-nowrap">{order.date}</TableCell>
                <TableCell className="whitespace-nowrap">
                  ${order.total.toFixed(2)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant="secondary">{order.tipo_venta}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <OrderDetailsModal documentId={order.documentId}>
                      <Button variant="ghost" size="icon" title="Ver detalles">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Ver detalles</span>
                      </Button>
                    </OrderDetailsModal>

                    <Button
                      variant="ghost"
                      size="icon"
                      title="Ver ticket de cambio (PDF)"
                      onClick={() => verTicketPDF(order)}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Ver ticket de cambio</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile (cards) */}
      <div className="grid gap-4 sm:hidden mt-4 px-4">
        {visibles.map((order) => (
          <div
            key={order.id}
            className="border rounded-2xl p-4 shadow-sm bg-white flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">ORD-{order.id}</h3>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Fecha: {order.date}</p>
              <p>Total: ${order.total.toFixed(2)}</p>
              <p className="capitalize">Tipo: {order.tipo_venta}</p>
            </div>

            <div className="flex gap-2 mt-1">
              <OrderDetailsModal documentId={order.documentId}>
                <Button variant="ghost" size="icon" title="Ver detalles">
                  <Eye className="w-5 h-5" />
                  <span className="sr-only">Ver detalles</span>
                </Button>
              </OrderDetailsModal>

              <Button
                variant="ghost"
                size="icon"
                title="Ver ticket de cambio (PDF)"
                onClick={() => verTicketPDF(order)}
              >
                <FileText className="w-5 h-5" />
                <span className="sr-only">Ver ticket de cambio</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer paginación */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {ordenesFiltradas.length ? (
            <>
              Mostrando <span className="font-medium">{showingFrom}</span>–
              <span className="font-medium">{showingTo}</span> de{" "}
              <span className="font-medium">{ordenesFiltradas.length}</span>
            </>
          ) : (
            "Sin resultados"
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto overflow-x-auto">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNumbers.map((n, idx) =>
            typeof n === "number" ? (
              <Button
                key={idx}
                variant={n === page ? "default" : "outline"}
                size="sm"
                className={`h-9 min-w-9 px-3 ${n === page ? "pointer-events-none" : ""}`}
                onClick={() => setPage(n)}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </Button>
            ) : (
              <span key={idx} className="px-2 text-muted-foreground select-none">
                …
              </span>
            )
          )}

          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
