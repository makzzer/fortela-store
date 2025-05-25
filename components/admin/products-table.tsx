"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, MoreHorizontal, QrCode } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProductos } from "@/app/context/ProductosContext";

interface Props {
  filtro: string;
}

export default function ProductsTable({ filtro }: Props) {
  const productos = useProductos();

  const productosFiltrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* ✅ VISTA DESKTOP */}
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
                <TableCell>${product.precio.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={product.stock > 10 ? "outline" : "destructive"}>
                    {product.stock} en stock
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

      {/* ✅ VISTA MOBILE (cards) */}
      <div className="grid gap-4 sm:hidden mt-4 px-4">
        {productosFiltrados.map((product) => (
          <div key={product.id} className="border rounded-xl p-4 shadow-sm bg-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-base">{product.nombre}</h3>
              <Badge variant={product.stock > 10 ? "outline" : "destructive"}>
                {product.stock} en stock
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              Género: {product.genero}
            </p>
            <p className="text-sm text-muted-foreground mb-3">
              Precio: ${product.precio.toFixed(2)}
            </p>
            <div className="flex gap-2">
              <Link
                href={`/admin/products/${product.documentId}`}
                className="flex items-center gap-1 rounded-md bg-gray-400/60 px-3 py-1 text-sm hover:bg-gray-200 transition"
              >
                <Edit className="h-4 w-4" /> Editar
              </Link>
              <Link
                href={`/admin/stock?id=${product.documentId}`}
                className="flex items-center gap-1 rounded-md bg-gray-400/60 px-3 py-1 text-sm hover:bg-gray-200 transition"
              >
                <QrCode className="h-4 w-4" /> Stock
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
