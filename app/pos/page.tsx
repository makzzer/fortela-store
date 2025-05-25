"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import POSCartItem from "@/components/pos/pos-cart-item";
import { Scan, ShoppingCart, CreditCard, Trash2 } from "lucide-react";

interface POSItem {
  id: string;
  documentId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  qr_code: string;
  stock: number;
}

const QRScanner = dynamic(() => import("@/components/admin/qr-scanner"), { ssr: false });

export default function POSPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [cart, setCart] = useState<POSItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleScan = async (code: string) => {
    setIsScanning(false);
    try {
      const res = await fetch(
        `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${code}`
      );
      const data = await res.json();
      if (!data.data.length) {
        toast({
          variant: "destructive",
          title: "Producto no encontrado",
          description: `No se encontró un producto con ID: ${code}`,
        });
        return;
      }

      const item = data.data[0];

      const product: POSItem = {
        id: item.id.toString(),
        documentId: item.documentId,
        name: item.nombre,
        price: item.precio,
        size: item.talles?.[0] || "M",
        qr_code: item.documentId,
        quantity: 1,
        stock: item.stock,
      };

      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (i) => i.qr_code === product.qr_code && i.size === product.size
        );
        return existingItem
          ? prevCart.map((i) =>
              i.qr_code === product.qr_code && i.size === product.size
                ? { ...i, quantity: i.quantity + 1 }
                : i
            )
          : [...prevCart, product];
      });

      toast({ title: "Producto agregado", description: `${product.name}` });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el producto.",
      });
    }
  };

  const updateQuantity = (id: string, size: string | undefined, amount: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id && item.size === size
          ? { ...item, quantity: Math.max(1, item.quantity + amount) }
          : item
      )
    );
  };

  const removeItem = (id: string, size: string | undefined) => {
    setCart((prevCart) => prevCart.filter((item) => !(item.id === id && item.size === size)));
  };

  const clearCart = () => setCart([]);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      const productos = cart.map((item) => item.documentId);
      const fecha = new Date().toISOString();
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const res = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            total,
            estado: "pendiente",
            tipo_venta: "mostrador",
            fecha,
            fortela_productos: productos,
            fortela_cliente: 1,
          },
        }),
      });

      if (!res.ok) throw new Error("Error al crear la orden");

      for (const item of cart) {
        const getRes = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}`
        );
        const data = await getRes.json();
        const producto = data?.data?.[0];

        if (!producto) {
          console.error("❌ Producto no encontrado al actualizar stock:", item.documentId);
          continue;
        }

        const productoId = producto.documentId;
        const stockActual = producto.stock;

        if (typeof stockActual === "number") {
          const newStock = stockActual - item.quantity;
          const putRes = await fetch(
            `https://vps-4937880-x.dattaweb.com/api/productos/${productoId}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                data: {
                  stock: newStock >= 0 ? newStock : 0,
                },
              }),
            }
          );

          if (!putRes.ok) {
            console.error(`❌ Falló actualización de stock para ${productoId}`);
          }
        } else {
          console.warn("⚠️ Stock inválido para producto:", productoId);
        }
      }

      toast({
        title: "Venta completada",
        description: `Se procesaron ${cart.length} productos.`,
      });

      clearCart();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error al procesar",
        description: "Ocurrió un problema al confirmar la venta.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Venta por Mostrador</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Escanear Productos</CardTitle>
            </CardHeader>
            <CardContent>
              {isScanning ? (
                <div className="space-y-4">
                  <QRScanner onScan={handleScan} />
                  <Button variant="outline" onClick={() => setIsScanning(false)} className="w-full">
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsScanning(true)} className="w-full" size="lg">
                  <Scan className="mr-2 h-4 w-4" /> Comenzar Escaneo
                </Button>
              )}

              {cart.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-medium">Carrito</h3>
                  {cart.map((item, index) => (
                    <POSCartItem
                      key={`${item.id}-${item.size}-${index}`}
                      item={item}
                      onIncrement={() => updateQuantity(item.id, item.size, 1)}
                      onDecrement={() => updateQuantity(item.id, item.size, -1)}
                      onRemove={() => removeItem(item.id, item.size)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Resumen</span>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4 mr-1" /> Vaciar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No hay productos escaneados</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impuesto (7%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mb-3"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Procesando..." : "Confirmar Venta"}
                    {!isProcessing && <CreditCard className="ml-2 h-4 w-4" />}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
