"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, QrCode, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useProductos } from "@/app/context/ProductosContext";
import StockDetailPopover from "@/components/admin/stock-detail-popover";

interface Props {
  filtro: string;
}

function normalize(s: any): string {
  if (Array.isArray(s)) return s.join(" ").toLowerCase();
  return (s ?? "").toString().toLowerCase();
}

export default function ProductsTable({ filtro }: Props) {
  const productos = useProductos();
  const [qrFor, setQrFor] = useState<{ id: string; value: string; nombre: string } | null>(null);

  const filtroLc = filtro.toLowerCase().trim();

  const productosFiltrados = useMemo(() => {
    if (!filtroLc) return productos;
    return productos.filter((p) => {
      const hay = [
        p.nombre,
        p.descripcion,
        p.genero,
        p.colegio,            // array
        p.nivel_educativo,    // array
        p.variantesPorTalle?.map(v => `${v.talle} ${v.precio}`)
      ].map(normalize).join(" ");
      return hay.includes(filtroLc);
    });
  }, [productos, filtroLc]);

  const getStockTotal = (product: any) => {
    return Array.isArray(product.variantesPorTalle)
      ? product.variantesPorTalle.reduce((acc: number, v: any) => acc + (v.cantidad || 0), 0)
      : product.stock || 0;
  };

  const hasLowStock = (product: any) => {
    return product.variantesPorTalle?.some((v: any) => v.cantidad <= 10);
  };

  const openQR = (p: any) => {
    const random = Math.random().toString(36).slice(2, 10);
    const value = `FORTELA:${p.documentId}:${random}`;
    setQrFor({ id: p.documentId, value, nombre: p.nombre });
  };

  return (
    <div className="w-full">
      {/* DIALOG QR */}
      <Dialog open={!!qrFor} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR del producto</DialogTitle>
            <DialogDescription>{qrFor?.nombre}</DialogDescription>
          </DialogHeader>
          {qrFor && (
            <div className="flex flex-col items-center gap-3">
              <img
                alt="QR"
                className="w-56 h-56"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrFor.value)}`}
              />
              <code className="text-xs bg-muted px-2 py-1 rounded">{qrFor.value}</code>
              <Button
                onClick={() => navigator.clipboard.writeText(qrFor.value)}
                className="mt-1"
                variant="secondary"
              >
                Copiar código
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DESKTOP */}
      <TooltipProvider delayDuration={150}>
        <div className="hidden sm:block overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: "55%" }}>Producto</TableHead>
                <TableHead className="text-center" style={{ width: "12%" }}>Género</TableHead>
                <TableHead style={{ width: "17%" }}>Stock</TableHead>
                <TableHead className="text-center" style={{ width: "8%" }}>QR</TableHead>
                <TableHead className="text-right" style={{ width: "8%" }}>Editar</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {productosFiltrados.map((product) => {
                const totalStock = getStockTotal(product);
                const lowStock = hasLowStock(product);
                const colegiosStr = Array.isArray(product.colegio) ? product.colegio.join(", ") : "";

                return (
                  <TableRow
                    key={product.id}
                    className={lowStock ? "bg-red-50 border-y border-red-200" : ""}
                  >

                    {/* PRODUCTO */}
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-muted relative shrink-0">
                          <Image src={"/nike.jpeg"} alt={product.nombre} fill className="object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-medium truncate cursor-help">
                                {product.nombre}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" align="start" className="max-w-[520px] break-words">
                              {product.nombre}
                            </TooltipContent>
                          </Tooltip>
                          {colegiosStr && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-muted-foreground truncate cursor-help">
                                  {colegiosStr}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" align="start" className="max-w-[520px] break-words">
                                {colegiosStr}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </TableCell>


                    {/* GÉNERO */}
                    <TableCell className="capitalize text-center">{product.genero}</TableCell>

                    {/* STOCK */}
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={totalStock > 10 ? "outline" : "destructive"}>
                          {totalStock} en stock
                        </Badge>
                        {Array.isArray(product.variantesPorTalle) && product.variantesPorTalle.length > 0 && (
                          <StockDetailPopover variantes={product.variantesPorTalle} />
                        )}
                      </div>
                    </TableCell>

                    {/* QR */}
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ver QR"
                        onClick={() => openQR(product)}
                        className="hover:bg-neutral-100"
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </TableCell>

                    {/* EDITAR */}
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/products/${product.documentId}`}
                        className="inline-flex items-center gap-2 rounded-full  px-4 py-2 text-sm font-medium  "
                      >
                        <Edit className="h-4 w-4" />

                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TooltipProvider>

      {/* MOBILE (tarjeta limpia y responsiva) */}
      <div className="grid gap-4 sm:hidden mt-4 px-4">
        {productosFiltrados.map((product) => {
          const totalStock = getStockTotal(product);
          const lowStock = hasLowStock(product);

          return (
            <div
              key={product.id}
              className={`border rounded-xl p-4 shadow-sm transition ${lowStock ? "bg-red-50 border-red-200" : "bg-white"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base">{product.nombre}</h3>
                <Badge className={`text-xs px-2 py-1 font-medium rounded-full ${totalStock <= 10 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-800"}`}>
                  {totalStock} en stock
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground capitalize">Género: {product.genero}</p>

              {Array.isArray(product.variantesPorTalle) && product.variantesPorTalle.length > 0 && (
                <div className="mt-3">
                  {/* Encabezado mini */}
                  <div className="flex justify-between text-[11px] text-muted-foreground/80 mb-1">
                    <span>Talle</span>
                    <span>Precio • Stock</span>
                  </div>

                  <div className="text-sm mb-3 space-y-1">
                    {product.variantesPorTalle.map((v: any, idx: number) => {
                      const key = v?.id ?? `${v?.talle ?? "sin-talle"}-${idx}`;
                      const qty = Number(v?.cantidad ?? 0);
                      const price = Number(v?.precio ?? 0);
                      const isLow = qty <= 10;

                      return (
                        <div
                          key={key}
                          className={`flex justify-between ${isLow ? "text-red-700 font-semibold" : "text-muted-foreground"}`}
                        >
                          <span className="capitalize">{v?.talle ?? "-"}</span>
                          <span>
                            ${price.toLocaleString("es-AR")} • {qty} u.
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="secondary" onClick={() => openQR(product)}>
                  <Eye className="h-4 w-4 mr-1" /> QR
                </Button>
                <Link
                  href={`/admin/products/${product.documentId}`}
                  className="flex items-center gap-1 rounded-md bg-gray-800 text-white px-3 py-1 text-sm hover:bg-gray-700 transition"
                >
                  <Edit className="h-4 w-4" /> Editar
                </Link>
                <Link
                  href={`/admin/stock?id=${product.documentId}`}
                  className="flex items-center gap-1 rounded-md bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 transition"
                >
                  <QrCode className="h-4 w-4" /> Stock
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
