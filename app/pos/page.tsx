"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import QRScanner from "@/components/admin/qr-scanner";
import POSCartItem from "@/components/pos/pos-cart-item";
import { Scan, ShoppingCart, CreditCard, Trash2 } from "lucide-react";

interface POSItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  qr_code: string;
  stock:number;
}

export default function POSPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [cart, setCart] = useState<POSItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleScan = async (code: string) => {
    setIsScanning(false);
    try {
      const res = await fetch(
        `https://vps-4937880-x.dattaweb.com/api/productos?filters[qr_code][$eq]=${code}`
      );
      const data = await res.json();

      if (!data.data.length) throw new Error("Producto no encontrado");

      const item = data.data[0];

      const product = {
        id: item.id.toString(),
        name: item.nombre,
        price: item.precio,
        size: item.talles?.[0] || "M",
        qr_code: item.qr_code,
        quantity: 1,
        stock:item.stock,
      };

      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (i) => i.qr_code === product.qr_code && i.size === product.size
        );

        if (existingItem) {
          return prevCart.map((i) =>
            i.qr_code === product.qr_code && i.size === product.size
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        } else {
          return [...prevCart, product];
        }
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
      const qr_logs = cart.map((item) => item.qr_code);
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const res = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ventas-por-mostrador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            total,
            vendedor: "Franco",
            qr_logs,
            fecha: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) throw new Error("Error al guardar la venta");

      // Actualizar el stock de cada producto vendido
      await Promise.all(
        cart.map(async (item) => {
          await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${item.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: { stock: { $subtract: [item.stock, item.quantity] } },
            }),
          });
        })
      );

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
                <div className="mt-6">
                  <h3 className="font-medium mb-3">Carrito</h3>
                  <div className="space-y-3">
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
                <div>
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

                  <Button className="w-full mb-3" size="lg" onClick={handleCheckout} disabled={isProcessing}>
                    {isProcessing ? "Procesando..." : "Confirmar Venta"}
                    {!isProcessing && <CreditCard className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
