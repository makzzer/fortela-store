"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, QrCode, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { useProductos } from "@/app/context/ProductosContext";
import StockDetailPopover from "@/components/admin/stock-detail-popover";
import { buildProductQRData } from "@/app/lib/qr";

interface Props {
  filtro: string;
}

function normalize(s: any): string {
  if (Array.isArray(s)) return s.join(" ").toLowerCase();
  return (s ?? "").toString().toLowerCase();
}

const PAGE_SIZE = 20;

export default function ProductsTable({ filtro }: Props) {
  const productos = useProductos();
  const [qrFor, setQrFor] = useState<{ id: string; value: string; nombre: string } | null>(null);

  const [page, setPage] = useState(1); // 1-indexed
  const topRef = useRef<HTMLDivElement | null>(null);
  const filtroLc = filtro.toLowerCase().trim();

  const [detailFor, setDetailFor] = useState<any | null>(null);



  useEffect(() => {
    // sube al principio del documento y del componente (por si hay contenedores scrollables)
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  // --- NUEVOS HELPERS PARA FORMATO "por colegio" ---
  const getNestedVariants = (product: any) => {
    const vpc = Array.isArray(product.variantesPorColegio)
      ? product.variantesPorColegio
      : [];
    // En tu API quedó "variantesPorTalles" (con s)
    const flattened: Array<{ colegio: string; talle: string; cantidad: number; precio: number }> = [];
    for (const c of vpc) {
      const colegio = (c?.colegio ?? "").toString();
      const talles = Array.isArray(c?.variantesPorTalles) ? c.variantesPorTalles : [];
      for (const v of talles) {
        flattened.push({
          colegio,
          talle: v?.talle ?? "",
          cantidad: Number(v?.cantidad ?? 0),
          precio: Number(v?.precio ?? 0),
        });
      }
    }
    return flattened;
  };


  const productosFiltrados = useMemo(() => {
    if (!filtroLc) return productos;
    return productos.filter((p) => {
      const nested = getNestedVariants(p); // ← nuevo
      const nestedText = nested
        .map((x) => `${x.colegio} ${x.talle} ${x.precio} ${x.cantidad}`)
        .join(" ");
      const legacyTalles = p.variantesPorTalle?.map((v: any) => `${v.talle} ${v.precio} ${v.cantidad}`).join(" ") ?? "";

      const hay = [
        p.nombre,
        p.descripcion,
        p.genero,
        Array.isArray(p.colegio) ? p.colegio.join(" ") : p.colegio,
        Array.isArray(p.nivel_educativo) ? p.nivel_educativo.join(" ") : p.nivel_educativo,
        legacyTalles,
        nestedText, // ← incluye colegios/talles del nuevo esquema
      ]
        .map(normalize)
        .join(" ");

      return hay.includes(filtroLc);
    });
  }, [productos, filtroLc]);


  // --- PAGINACIÓN ---
  const pageCount = Math.max(1, Math.ceil(productosFiltrados.length / PAGE_SIZE));
  useEffect(() => {
    // si cambia el filtro o el total, volvemos a la primera página
    setPage(1);
  }, [filtroLc]);

  // clamp por si el filtro achica la cantidad de páginas
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const visibles = productosFiltrados.slice(startIdx, endIdx);

  const showingFrom = productosFiltrados.length ? startIdx + 1 : 0;
  const showingTo = Math.min(endIdx, productosFiltrados.length);

  // Números de página (con elipsis cuando hay muchas)
  const pageNumbers = useMemo(() => {
    const nums: (number | string)[] = [];
    const delta = 2; // páginas a cada lado
    let l: number | undefined;

    for (let i = 1; i <= pageCount; i++) {
      if (i === 1 || i === pageCount || (i >= page - delta && i <= page + delta)) {
        if (l && i - l > 1) nums.push(i - l === 2 ? l + 1 : "…");
        nums.push(i);
        l = i;
      }
    }
    return nums;
  }, [page, pageCount]);





  const renderDetailTable = (product: any) => {
    const vpc = Array.isArray(product?.variantesPorColegio) ? product.variantesPorColegio : [];
    if (!vpc.length) return null;

    return (
      <div className="mt-2 space-y-4">
        {vpc.map((c: any, i: number) => (
          <div key={i} className="border rounded-lg overflow-hidden">
            <div className="px-4 py-2 font-semibold bg-muted text-sm">
              {c?.colegio || "Sin colegio"}
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="text-left">
                    <th className="px-4 py-2 w-1/3">Talle</th>
                    <th className="px-4 py-2 w-1/3">Precio</th>
                    <th className="px-4 py-2 w-1/3 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(c?.variantesPorTalles) ? c.variantesPorTalles : []).map((v: any, j: number) => {
                    const qty = Number(v?.cantidad ?? 0);
                    const price = Number(v?.precio ?? 0);
                    return (
                      <tr key={v?.id ?? `${i}-${j}`} className="border-t">
                        <td className="px-4 py-2 capitalize">{v?.talle ?? "-"}</td>
                        <td className="px-4 py-2">{isNaN(price) ? "-" : `$${price.toLocaleString("es-AR")}`}</td>
                        <td className={`px-4 py-2 text-right ${qty <= 10 ? "text-red-700 font-semibold" : ""}`}>{qty} u.</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };


  // Construye lineas compactas para el preview en tabla (desktop y mobile)
  const buildColegioPreviewLines = (product: any) => {
    const vpc = Array.isArray(product.variantesPorColegio)
      ? product.variantesPorColegio
      : [];
    // armamos: "San Marcelo: S $2300 • 20u · L $5400 • 200u"
    return vpc.map((c: any) => {
      const colegio = (c?.colegio ?? "").toString();
      const talles = (Array.isArray(c?.variantesPorTalles) ? c.variantesPorTalles : [])
        .map((v: any) => {
          const qty = Number(v?.cantidad ?? 0);
          const price = Number(v?.precio ?? 0);
          const priceStr = isNaN(price) ? "-" : `$${price.toLocaleString("es-AR")}`;
          return `${v?.talle ?? "-"} ${priceStr} • ${qty}u`;
        })
        .join(" · ");
      return `${colegio ? colegio + ": " : ""}${talles}`;
    });
  };




  // --- helpers existentes ---
  // --- helpers existentes ---
  const getStockTotal = (product: any) => {
    // Usamos el total ya calculado en el Context (seguro y simple)
    if (typeof product?.stock === "number") return product.stock;

    // fallback legacy por si algún item no trae "stock"
    if (Array.isArray(product?.variantesPorTalle)) {
      return product.variantesPorTalle.reduce((acc: number, v: any) => acc + (Number(v?.cantidad) || 0), 0);
    }

    // fallback nuevo: sumamos anidados
    const nested = getNestedVariants(product);
    return nested.reduce((acc, v) => acc + (v.cantidad || 0), 0);
  };

  const hasLowStock = (product: any) => {
    // Si hay variantes globales (legacy)
    if (Array.isArray(product?.variantesPorTalle) && product.variantesPorTalle.length > 0) {
      return product.variantesPorTalle.some((v: any) => Number(v?.cantidad ?? 0) <= 10);
    }
    // Si hay variantes por colegio
    const nested = getNestedVariants(product);
    if (nested.length > 0) {
      return nested.some((v) => v.cantidad <= 10);
    }
    return false;
  };


  const openQR = (p: any) => {
    const value = buildProductQRData(p.documentId); // ← SOLO documentId
    setQrFor({ id: p.documentId, value, nombre: p.nombre });
  };

  return (
    <div className="w-full">
      <div ref={topRef} />
      {/* DIALOG QR */}
      <Dialog open={!!qrFor} onOpenChange={(o) => !o && setQrFor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR del producto</DialogTitle>
            <DialogDescription>{qrFor?.nombre}</DialogDescription>
          </DialogHeader>

          {qrFor && (() => {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrFor.value)}`;

            const handlePrint = () => {
              const w = window.open("", "_blank");
              if (!w) return;
              w.document.write(`
                <!doctype html><html><head><meta charset="utf-8"><title>Imprimir QR</title>
                <style>html,body{margin:0;padding:0}.wrap{display:flex;align-items:center;justify-content:center;min-height:100vh;}img{width:220px;height:220px}</style>
                </head><body><div class="wrap"><img id="qr" src="${qrUrl}" alt="QR" /></div>
                <script>const img=document.getElementById('qr');img.addEventListener('load',()=>{window.print();window.close();});</script>
              </body></html>`);
              w.document.close();
              w.focus();
            };

            const handleDownload = async () => {
              try {
                const res = await fetch(qrUrl, { mode: "cors" });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${(qrFor.nombre || "qr").toString().replace(/[^\w\-]+/g, "_")}.png`;
                document.body.appendChild(a); a.click(); a.remove();
                URL.revokeObjectURL(url);
              } catch {
                window.open(qrUrl, "_blank");
              }
            };

            return (
              <div className="flex flex-col items-center gap-3">
                <img alt="QR" className="w-56 h-56" src={qrUrl} />
                <code className="text-xs bg-muted px-2 py-1 rounded">{qrFor.value}</code>
                <div className="flex gap-2 pt-1">
                  <Button onClick={handlePrint}>Imprimir</Button>
                  <Button variant="secondary" onClick={handleDownload}>Descargar</Button>
                </div>
              </div>
            );
          })()}
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
              {visibles.map((product) => {
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


                        {/* NUEVO: botón para abrir modal de detalle */}
                        {Array.isArray(product.variantesPorColegio) && product.variantesPorColegio.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-2 h-7 text-xs"
                            onClick={() => setDetailFor(product)}
                          >
                            Más info
                          </Button>
                        )}


                        {/* LEGACY: detalle por talle global (sigue funcionando igual) */}
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


                    {/* DIALOG DETALLE POR COLEGIO/TALLE */}
                    <Dialog open={!!detailFor} onOpenChange={(o) => !o && setDetailFor(null)}>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalle de stock</DialogTitle>
                          <DialogDescription className="truncate">
                            {detailFor?.nombre}
                          </DialogDescription>
                        </DialogHeader>
                        {detailFor && (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">
                                {Array.isArray(detailFor?.variantesPorColegio) ? detailFor.variantesPorColegio.length : 0} colegio(s)
                              </span>
                              <span className="font-medium">
                                Total: {typeof detailFor?.stock === "number" ? detailFor.stock : 0} u.
                              </span>
                            </div>
                            {renderDetailTable(detailFor)}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>


                    {/* EDITAR */}
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/products/${product.documentId}`}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
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
        {visibles.map((product) => {
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
              {/* NUEVO: detalle por colegio -> talles */}
              {Array.isArray(product.variantesPorColegio) && product.variantesPorColegio.length > 0 && (
                <div className="mt-3">
                  <div className="text-[11px] text-muted-foreground/80 mb-1">Colegio • Talle • Precio • Stock</div>
                  <div className="text-sm space-y-2">
                    {product.variantesPorColegio.map((c: any, idxC: number) => (
                      <div key={idxC}>
                        <div className="font-medium text-[13px]">{c?.colegio ?? "-"}</div>
                        <div className="mt-1 space-y-1">
                          {(Array.isArray(c?.variantesPorTalles) ? c.variantesPorTalles : []).map((v: any, idxV: number) => {
                            const qty = Number(v?.cantidad ?? 0);
                            const price = Number(v?.precio ?? 0);
                            return (
                              <div key={v?.id ?? `${idxC}-${idxV}`} className={`flex justify-between ${qty <= 10 ? "text-red-700 font-semibold" : "text-muted-foreground"}`}>
                                <span className="capitalize">{v?.talle ?? "-"}</span>
                                <span>${isNaN(price) ? "-" : price.toLocaleString("es-AR")} • {qty} u.</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/** LEGACY: detalle por talle global */}

              {Array.isArray(product.variantesPorTalle) && product.variantesPorTalle.length > 0 && (
                <div className="mt-3">
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
                        <div key={key} className={`flex justify-between ${isLow ? "text-red-700 font-semibold" : "text-muted-foreground"}`}>
                          <span className="capitalize">{v?.talle ?? "-"}</span>
                          <span>${isNaN(price) ? "-" : price.toLocaleString("es-AR")} • {qty} u.</span>
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

      {/* FOOTER PAGINACIÓN */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {productosFiltrados.length
            ? <>Mostrando <span className="font-medium">{showingFrom}</span>–<span className="font-medium">{showingTo}</span> de <span className="font-medium">{productosFiltrados.length}</span></>
            : "Sin resultados"}
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
              <span key={idx} className="px-2 text-muted-foreground select-none">…</span>
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
