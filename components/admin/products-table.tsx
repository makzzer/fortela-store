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
    <Table>
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
                    src={"/placeholder.svg"} // Reemplazá si tenés imagen real
                    alt={product.nombre}
                    fill
                    className="object-cover"
                  />
                </div>
                <span className="font-medium">{product.nombre}</span>
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
                      <QrCode className="mr-2 h-4 w-4" /> Gestionar stock
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
