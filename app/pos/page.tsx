"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import POSCartItem from "@/components/pos/pos-cart-item";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Scan, ShoppingCart, CreditCard, Trash2 } from "lucide-react";
import Swal from "sweetalert2";

interface POSItem {
  id: string;
  documentId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  qr_code: string;
  stock: number;
  totalStock: number;
}

const QRScanner = dynamic(() => import("@/components/admin/qr-scanner"), { ssr: false });

export default function POSPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [cart, setCart] = useState<POSItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [variantes, setVariantes] = useState<any[]>([]);
  const [productoActual, setProductoActual] = useState<any | null>(null);
  const [selectedTalle, setSelectedTalle] = useState<string>("");


  const handleScan = async (code: string) => {
    setIsScanning(false);
    try {
      const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${code}&populate=*`);
      const data = await res.json();

      if (!data.data.length) {
        toast({ variant: "destructive", title: "Producto no encontrado", description: `ID: ${code}` });
        return;
      }

      const item = data.data[0];
      const variantes = item.variantesPorTalle || [];

      if (!variantes.length) {
        toast({ variant: "destructive", title: "Sin stock por talle" });
        return;
      }

      setProductoActual({ ...item, totalStock: item.stock });
      setVariantes(variantes);
      setShowModal(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Error al escanear producto" });
    }
  };

  const confirmarTalle = () => {
    const variante = variantes.find((v) => v.talle === selectedTalle);
    if (!variante || !productoActual) return;

    if (variante.cantidad <= 0) {
      toast({ variant: "destructive", title: "Sin stock disponible", description: `El talle ${variante.talle} no tiene unidades disponibles.` });
      setShowModal(false);
      setSelectedTalle("");
      return;
    }

    const product: POSItem = {
      id: productoActual.id.toString(),
      documentId: productoActual.documentId,
      name: productoActual.nombre,
      price: variante.precio || productoActual.precio,
      size: variante.talle,
      qr_code: productoActual.documentId,
      quantity: 1,
      stock: variante.cantidad,
      totalStock: productoActual.totalStock || 0,
    };

    setCart((prev) => {
      const existing = prev.find((i) => i.qr_code === product.qr_code && i.size === product.size);
      if (existing && existing.quantity >= variante.cantidad) {
        toast({ variant: "destructive", title: "Stock insuficiente", description: `Ya agregaste todas las unidades disponibles del talle ${product.size}.` });
        return prev;
      }
      return existing
        ? prev.map((i) => i.qr_code === product.qr_code && i.size === product.size ? { ...i, quantity: i.quantity + 1 } : i)
        : [...prev, product];
    });

    toast({ title: "Producto agregado", description: `${product.name} - Talle ${product.size}` });
    setShowModal(false);
    setSelectedTalle("");
  };

  const updateQuantity = (id: string, size: string | undefined, amount: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.id === id && i.size === size) {
        const nuevaCantidad = i.quantity + amount;
        if (amount > 0 && nuevaCantidad > i.stock) {
          toast({ variant: "destructive", title: "Sin stock suficiente", description: `Solo hay ${i.stock} unidades disponibles del talle ${i.size}.` });
          return i;
        }
        return { ...i, quantity: Math.max(1, nuevaCantidad) };
      }
      return i;
    }));
  };

  const removeItem = (id: string, size: string | undefined) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    try {
      for (const item of cart) {
        const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}&populate=*`);
        const data = await res.json();
        const producto = data.data?.[0];

        if (!producto) {
          throw new Error(`Producto no encontrado: ${item.documentId}`);
        }

        const variante = producto.variantesPorTalle?.find((v: any) => v.talle === item.size);
        const stockDisponible = variante?.cantidad ?? 0;

        if (item.quantity > stockDisponible) {
          await Swal.fire({
            icon: "error",
            title: "Stock insuficiente",
            text: `El producto ${item.name} (Talle ${item.size}) tiene solo ${stockDisponible} unidad(es) disponibles.`,
            confirmButtonText: "Aceptar",
          });
          setIsCheckingOut(false);
          return;
        }
      }

      const fecha = new Date().toISOString();
      const ordenPayload = {
        data: {
          total,
          estado: "procesando",
          tipo_venta: "mostrador",
          fecha,
          fortela_cliente: 1,
        },
      };

      const ordenRes = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenPayload),
      });

      const ordenJson = await ordenRes.json();
      if (!ordenRes.ok) throw new Error("Error al crear la orden");

      const ordenId: number = ordenJson.data.id;

      for (const item of cart) {
        const productoRes = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}&populate=*`);
        const productoJson = await productoRes.json();
        const producto = productoJson?.data?.[0];
        const productoId = producto.id;

        const itemPayload = {
          data: {
            cantidad: item.quantity,
            fortela_producto: productoId,
            fortela_orden: ordenId,
            talle: item.size,
          },
        };

        await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemPayload),
        });

        const nuevasVariantes = producto.variantesPorTalle.map((v: any) => ({
          talle: v.talle,
          cantidad: v.talle === item.size ? Math.max(0, v.cantidad - item.quantity) : v.cantidad,
          precio: v.precio,
        }));

        const nuevoStockTotal = nuevasVariantes.reduce((sum: number, v: any) => sum + v.cantidad, 0);

        await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${item.documentId}?populate=*`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              variantesPorTalle: nuevasVariantes,
              stock: nuevoStockTotal,
            },
          }),
        });
      }

      toast({
        title: "Orden creada correctamente",
        description: "La venta ha sido registrada y el stock actualizado.",
      });

      clearCart();
    } catch (error) {
      console.error("❌ Checkout error:", error);
      toast({
        variant: "destructive",
        title: "Error al generar orden",
        description: "Ocurrió un error al finalizar la venta.",
      });
    } finally {
      setIsCheckingOut(false);
    }
  }

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
                  <Button variant="outline" onClick={() => setIsScanning(false)} className="w-full">Cancelar</Button>
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
                {cart.length > 0 && <Button variant="outline" size="sm" onClick={clearCart}><Trash2 className="h-4 w-4 mr-1" /> Vaciar</Button>}
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
                    <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Impuesto (7%)</span><span>${tax.toFixed(2)}</span></div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span><span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mb-3"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? "Procesando..." : "Confirmar Venta"}
                    {!isCheckingOut && <CreditCard className="ml-2 h-4 w-4" />}
                  </Button>

                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccioná el talle</DialogTitle>
          </DialogHeader>
          <RadioGroup value={selectedTalle} onValueChange={setSelectedTalle} className="space-y-2">
            {variantes.map((v) => (
              <div key={v.talle} className="flex items-center space-x-2">
                <RadioGroupItem value={v.talle} id={`talle-${v.talle}`} />
                <label htmlFor={`talle-${v.talle}`} className="capitalize cursor-pointer">
                  {v.talle} ({v.cantidad} disponibles)
                </label>
              </div>
            ))}
          </RadioGroup>
          <Button onClick={confirmarTalle} disabled={!selectedTalle} className="w-full mt-4">
            Confirmar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
