"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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

interface Order {
  id: number;
  total: number;
  date: string;
  status: string;
  tipo_venta: string;
  documentId: string;
  items: Item[];
}

interface Props {
  order: Order;
}

export default function OrderDetailsModal({ order }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-2" /> Ver Detalles
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full">
        <h2 className="text-xl font-bold mb-4">Factura de Orden ORD-{order.id}</h2>

        <div className="text-sm text-muted-foreground mb-4">
          <p>Fecha: {order.date}</p>
          <p>Tipo de venta: {order.tipo_venta}</p>
          <p className="capitalize">Estado: {order.status}</p>
        </div>

        <div className="border rounded-lg overflow-hidden mb-4">
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
              {order.items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">{item.producto.nombre}</td>
                  <td className="p-2">{item.producto.descripcion}</td>
                  <td className="p-2 text-center">{item.talle}</td>
                  <td className="p-2 text-center">{item.cantidad}</td>
                  <td className="p-2 text-right">${item.producto.precio.toFixed(2)}</td>
                  <td className="p-2 text-right">
                    ${(item.producto.precio * item.cantidad).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-right font-semibold text-lg">
          Total: ${order.total.toFixed(2)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
