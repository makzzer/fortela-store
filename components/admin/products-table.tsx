"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, QrCode } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProductos } from "@/app/context/ProductosContext";
import StockDetailPopover from "@/components/admin/stock-detail-popover";

interface Props {
  filtro: string;
}

export default function ProductsTable({ filtro }: Props) {
  const productos = useProductos();

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  const getStockTotal = (product: any) => {
    return Array.isArray(product.variantesPorTalle)
      ? product.variantesPorTalle.reduce((acc: number, v: any) => acc + (v.cantidad || 0), 0)
      : product.stock || 0;
  };

  const getPriceRange = (product: any) => {
    const precios = Array.isArray(product.variantesPorTalle)
      ? product.variantesPorTalle.map((v: any) => v.precio)
      : [product.precio];
    const min = Math.min(...precios);
    const max = Math.max(...precios);
    return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  };

  return (
    <div className="w-full">
      {/* DESKTOP */}
      <div className="hidden sm:block overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Género</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productosFiltrados.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-muted relative">
                      <Image
                        src={"/placeholder.svg"}
                        alt={product.nombre}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium whitespace-nowrap">{product.nombre}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{product.genero}</TableCell>
                <TableCell>{getPriceRange(product)}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <Badge variant={getStockTotal(product) > 10 ? "outline" : "destructive"}>
                      {getStockTotal(product)} en stock
                    </Badge>
                    {Array.isArray(product.variantesPorTalle) && product.variantesPorTalle.length > 0 && (
                      <StockDetailPopover variantes={product.variantesPorTalle} />
                    )}
                  </div>
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
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/products/${product.documentId}`}>
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/stock?id=${product.documentId}`}>
                          <QrCode className="mr-2 h-4 w-4" /> Stock
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE */}
      {/* MOBILE */}
      <div className="grid gap-4 sm:hidden mt-4 px-4">
        {productosFiltrados.map((product) => {
          const totalStock = getStockTotal(product)
          const lowStock = product.variantesPorTalle?.some((v: any) => v.cantidad <= 10)

          return (
            <div
              key={product.id}
              className={`border rounded-xl p-4 shadow-sm transition ${lowStock ? "bg-red-50 border-red-200" : "bg-white"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base">{product.nombre}</h3>
                <Badge
                  className={`text-xs px-2 py-1 font-medium rounded-full ${totalStock <= 10
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {totalStock} en stock
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground capitalize">
                Género: {product.genero}
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                Precio: {getPriceRange(product)}
              </p>

              {Array.isArray(product.variantesPorTalle) && product.variantesPorTalle.length > 0 && (
                <div className="text-sm text-muted-foreground mb-3 space-y-1">
                  {product.variantesPorTalle.map((v: any) => (
                    <div
                      key={v.talle}
                      className={`flex justify-between ${v.cantidad <= 10 ? "text-red-700 font-semibold" : ""
                        }`}
                    >
                      <span className="capitalize">{v.talle}</span>
                      <span>
                        ${v.precio} - {v.cantidad} u.
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-2">
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
          )
        })}
      </div>

    </div>
  );
}
