"use client";

import { useEffect, useState } from "react";
import { Eye, MoreHorizontal, Truck, XCircle, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
// ⛔️ quitamos el modal viejo
// import TicketCambioModal from "./orders/TicketCambioModal";
import OrderDetailsModal from "./OrderDetailsModal";

interface Order {
  id: number;
  total: number;
  date: string;
  status: string;
  tipo_venta: string;
  documentId: string;
}

interface Props {
  filtro: string;
}

export default function OrdersTable({ filtro }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await fetch(
        "https://vps-4937880-x.dattaweb.com/api/fortela-ordenes?populate=fortela_cliente",
        { cache: "no-store" }
      );
      const data = await res.json();
      const formatted = data.data.map((order: any) => ({
        id: order.id,
        documentId: order.documentId,
        total: order.total,
        date: new Date(order.fecha).toLocaleDateString(),
        status: order.estado,
        tipo_venta: order.tipo_venta,
      }));
      setOrders(formatted);
    };
    fetchOrders();
  }, []);

  const ordenesFiltradas = orders.filter((o) =>
    `ORD-${o.id}`.toLowerCase().includes(filtro.toLowerCase())
  );

  // 👉 helper mínimo: POST -> /api/ticket-cambio y abrir PDF
  const verTicketPDF = async (order: Order) => {
    // Abrimos antes la pestaña para que el browser no bloquee el pop-up
    const newTab = window.open("", "_blank");
  
    try {
      const res = await fetch("/api/ticket-cambio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          numero: `ORD-${order.id}`,
          fecha: order.date,
          cliente: "Consumidor Final", // usa real si lo tenés
          ordenId: order.documentId, // 👉 el server usa esto para traer los ítems
          total: order.total,        // opcional; el server puede recalcular
        }),
      });
  
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "No se pudo generar el PDF");
      }
  
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
  
      if (newTab) {
        newTab.location.href = url; // carga el visor en la pestaña preabierta
      } else {
        window.open(url, "_blank");
      }
  
      // Limpieza del objeto URL
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error(e);
      if (newTab) newTab.close();
      alert("Error al generar el ticket. Probá de nuevo.");
    }
  };
  

  return (
    <div className="w-full overflow-x-hidden">
      {/* Desktop / Tablet */}
      <div className="hidden sm:block">
        <Table className="min-w-full table-auto">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenesFiltradas.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium whitespace-nowrap">ORD-{order.id}</TableCell>
                <TableCell className="whitespace-nowrap">{order.date}</TableCell>
                <TableCell className="whitespace-nowrap">${order.total.toFixed(2)}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant="secondary">{order.tipo_venta}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge
                    variant={
                      order.status === "completado"
                        ? "default"
                        : order.status === "pendiente"
                        ? "secondary"
                        : order.status === "cancelado"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />

                      {/* Ver detalles */}
                      <DropdownMenuItem asChild>
                        <OrderDetailsModal documentId={order.documentId} />
                      </DropdownMenuItem>

                      {/* ✅ Ver ticket de cambio (PDF on-demand) */}
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault(); // evita cerrar mal el menu
                          verTicketPDF(order);
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Ver ticket de cambio (PDF)
                      </DropdownMenuItem>

                      <DropdownMenuItem>
                        <Truck className="mr-2 h-4 w-4" /> Cambiar Estado
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <XCircle className="mr-2 h-4 w-4" /> Cancelar Orden
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile (cards) */}
      <div className="grid gap-4 sm:hidden mt-4 px-4">
        {ordenesFiltradas.map((order) => (
          <div key={order.id} className="border rounded-2xl p-4 shadow-sm bg-white flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-base">ORD-{order.id}</h3>
              <Badge
                variant={
                  order.status === "completado"
                    ? "default"
                    : order.status === "pendiente"
                    ? "secondary"
                    : order.status === "cancelado"
                    ? "destructive"
                    : "outline"
                }
              >
                {order.status}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Fecha: {order.date}</p>
              <p>Total: ${order.total.toFixed(2)}</p>
              <p className="capitalize">Tipo: {order.tipo_venta}</p>
            </div>

            <div className="flex gap-3 mt-1 flex-wrap">
              <OrderDetailsModal documentId={order.documentId} />

              {/* ✅ Botón simple para PDF */}
              <button
                onClick={() => verTicketPDF(order)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                title="Ver ticket de cambio (PDF)"
              >
                <FileText className="w-5 h-5 text-gray-700" />
              </button>

              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition" title="Cambiar estado">
                <Truck className="w-5 h-5 text-gray-700" />
              </button>
              <button className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition" title="Cancelar orden">
                <XCircle className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
