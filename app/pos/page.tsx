"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import POSCartItem from "@/components/pos/pos-cart-item";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Scan, ShoppingCart, CreditCard, Trash2 } from "lucide-react";
import Swal from "sweetalert2";



import { useRouter } from "next/navigation";
import { useCallback } from "react";


// Reemplazá tu interface POSItem por esta:
interface POSItem {
  id: string;
  documentId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string; // si no está definido => pendiente de talle
  qr_code: string;
  stock: number;
  totalStock: number;
  pendingSize?: boolean;
  variantes?: { talle: string; cantidad: number; precio?: number }[];
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
  // arriba, junto con el resto de useState:
  const [selecciones, setSelecciones] = useState<Record<string, number>>({});

  // item que está editando talles en el carrito
  const [sizePickerItem, setSizePickerItem] = useState<POSItem | null>(null);

  // cantidades por talle para el picker del carrito
  const [cartSizeSelections, setCartSizeSelections] = useState<Record<string, number>>({});

  const router = useRouter();


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
      // inicializamos cantidades (0) por talle
      setSelecciones(Object.fromEntries(variantes.map((v: any) => [v.talle, 0])));
      setShowModal(true);
    } catch {
      toast({ variant: "destructive", title: "Error al escanear producto" });
    }
  };


  const setCantidadTalle = (talle: string, cantidad: number, stockMax: number) => {
    setSelecciones(prev => ({ ...prev, [talle]: Math.max(0, Math.min(stockMax, cantidad)) }));
  };

  const incTalle = (talle: string, stockMax: number) => {
    setSelecciones(prev => ({ ...prev, [talle]: Math.min(stockMax, (prev[talle] ?? 0) + 1) }));
  };

  const decTalle = (talle: string) => {
    setSelecciones(prev => ({ ...prev, [talle]: Math.max(0, (prev[talle] ?? 0) - 1) }));
  };

  const openSizePicker = (item: POSItem) => {
    const base: Record<string, number> = {};
    (item.variantes ?? []).forEach(v => { base[v.talle] = 0; });
    setCartSizeSelections(base);
    setSizePickerItem(item);
  };


  const confirmarSelecciones = () => {
    if (!productoActual || !variantes?.length) return;
    let agregoAlgo = false;

    setCart(prev => {
      let updated = [...prev];

      for (const v of variantes) {
        const qty = selecciones[v.talle] ?? 0;
        if (qty <= 0) continue;

        const price = typeof v.precio === "number" ? v.precio : (productoActual.precio ?? 0);

        // buscar misma línea (mismo producto + mismo talle)
        const existing = updated.find(i => i.qr_code === productoActual.documentId && i.size === v.talle);
        const yaAgregado = existing ? existing.quantity : 0;

        // validar stock contra lo ya agregado
        if (qty + yaAgregado > (v.cantidad ?? 0)) {
          toast({
            variant: "destructive",
            title: "Stock insuficiente",
            description: `Talle ${v.talle}: pediste ${qty + yaAgregado} y hay ${v.cantidad}.`
          });
          continue;
        }

        if (existing) {
          updated = updated.map(i =>
            i.qr_code === productoActual.documentId && i.size === v.talle
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        } else {
          updated.push({
            id: productoActual.id.toString(),
            documentId: productoActual.documentId,
            name: productoActual.nombre,
            price,
            size: v.talle,
            qr_code: productoActual.documentId,
            quantity: qty,
            stock: v.cantidad,
            totalStock: productoActual.totalStock || 0,
            variantes: variantes.map((vx: any) => ({ talle: vx.talle, cantidad: vx.cantidad, precio: vx.precio })),
          });
        }

        agregoAlgo = true;
      }

      // si agregaste algo y existía una línea “pendiente de talle”, la removemos del array ya mutado
      if (agregoAlgo && sizePickerItem?.pendingSize) {
        updated = updated.filter(p => p !== sizePickerItem);
      }

      return updated;
    });

    toast({
      title: agregoAlgo ? "Productos agregados" : "Sin cambios",
      description: agregoAlgo ? "Se añadieron los talles seleccionados." : "No se agregó ningún talle.",
      variant: agregoAlgo ? "default" : "destructive"
    });

    setShowModal(false);
    setSelecciones({});
  };


  const continuarSinTalle = () => {
    if (!productoActual || !variantes?.length) return;
    const totalStock = variantes.reduce((s: number, v: any) => s + (v.cantidad ?? 0), 0);

    const productPendiente: POSItem = {
      id: productoActual.id.toString(),
      documentId: productoActual.documentId,
      name: productoActual.nombre,
      // si tu precio real depende del talle, podés dejar 0 y actualizar al asignar talle
      price: productoActual.precio ?? 0,
      size: undefined,
      qr_code: productoActual.documentId,
      quantity: 1,
      stock: totalStock,
      totalStock,
      pendingSize: true,
      variantes: variantes.map((v: any) => ({ talle: v.talle, cantidad: v.cantidad, precio: v.precio })),
    };

    setCart(prev => [...prev, productPendiente]);
    toast({ title: "Producto agregado", description: `${productPendiente.name} (talle pendiente)` });
    setShowModal(false);
    setSelecciones({});
  };


  const hasPending = cart.some(i => (i as any).pendingSize);

  const setCartPickerQty = (talle: string, qty: number, max: number) => {
    setCartSizeSelections(prev => ({ ...prev, [talle]: Math.max(0, Math.min(max, qty)) }));
  };
  const incCartPicker = (talle: string, max: number) => {
    setCartSizeSelections(prev => ({ ...prev, [talle]: Math.min(max, (prev[talle] ?? 0) + 1) }));
  };
  const decCartPicker = (talle: string) => {
    setCartSizeSelections(prev => ({ ...prev, [talle]: Math.max(0, (prev[talle] ?? 0) - 1) }));
  };

  // Aplicar selección múltiple al carrito (merge por talle)
  const applyCartSizeSelections = () => {
    if (!sizePickerItem || !(sizePickerItem.variantes?.length)) return;

    const variantes = sizePickerItem.variantes;
    let agregoAlgo = false;

    setCart(prev => {
      let updated = [...prev];

      for (const v of variantes) {
        const qty = cartSizeSelections[v.talle] ?? 0;
        if (qty <= 0) continue;

        const existing = updated.find(i => i.qr_code === sizePickerItem.qr_code && i.size === v.talle);
        const yaAgregado = existing ? existing.quantity : 0;
        const disponible = v.cantidad ?? 0;

        if (qty + yaAgregado > disponible) {
          toast({ variant: "destructive", title: "Stock insuficiente", description: `Talle ${v.talle}: pediste ${qty + yaAgregado} y hay ${disponible}.` });
          continue;
        }

        const price = typeof v.precio === "number" ? v.precio : sizePickerItem.price;

        if (existing) {
          updated = updated.map(i =>
            i.qr_code === sizePickerItem.qr_code && i.size === v.talle
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        } else {
          updated.push({
            id: sizePickerItem.id,
            documentId: sizePickerItem.documentId,
            name: sizePickerItem.name,
            price,
            size: v.talle,
            qr_code: sizePickerItem.qr_code,
            quantity: qty,
            stock: disponible,
            totalStock: sizePickerItem.totalStock,
          } as POSItem);
        }

        agregoAlgo = true;
      }

      // si se agregaron talles, eliminar la línea pendiente
      if (agregoAlgo && sizePickerItem?.pendingSize) {
        updated = updated.filter(p => p !== sizePickerItem);
      }

      return updated;
    });

    if (agregoAlgo) {
      toast({ title: "Talles agregados", description: "Se añadieron al carrito." });
    } else {
      toast({ variant: "destructive", title: "Sin cambios", description: "No se agregó ningún talle." });
    }

    setSizePickerItem(null);
    setCartSizeSelections({});
  };

  // Bloqueo en updateQuantity:
  const updateQuantity = (id: string, size: string | undefined, amount: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id && i.size === size) {
        if (!i.size) {
          toast({ variant: "destructive", title: "Elegí un talle", description: "Seleccioná un talle antes de ajustar la cantidad." });
          return i;
        }
        const nueva = i.quantity + amount;
        if (amount > 0 && nueva > i.stock) {
          toast({ variant: "destructive", title: "Sin stock suficiente", description: `Solo hay ${i.stock} unidades del talle ${i.size}.` });
          return i;
        }
        return { ...i, quantity: Math.max(1, nueva) };
      }
      return i;
    }));
  };


  const handleAsignarTalle = (item: POSItem, talleElegido: string) => {
    if (!talleElegido || !item.variantes?.length) return;
    const variante = item.variantes.find(v => v.talle === talleElegido);
    if (!variante) {
      toast({ variant: "destructive", title: "Talle inválido" });
      return;
    }
    setCart(prev => {
      const dup = prev.find(p => p.qr_code === item.qr_code && p.size === talleElegido && !p.pendingSize);
      const yaAgregado = dup ? dup.quantity : 0;
      const disponible = variante.cantidad ?? 0;

      if (yaAgregado + item.quantity > disponible) {
        toast({ variant: "destructive", title: "Stock insuficiente", description: `Solo ${disponible} unid. del talle ${talleElegido}.` });
        return prev;
      }

      const precioFinal = typeof variante.precio === "number" ? variante.precio : item.price;

      let next = [...prev];
      if (dup) {
        next = next.map(p =>
          p === dup ? { ...p, quantity: p.quantity + item.quantity } : p
        );
        next = next.filter(p => p !== item);
      } else {
        next = next.map(p =>
          p === item
            ? { ...p, size: talleElegido, stock: disponible, price: precioFinal, pendingSize: false }
            : p
        );
      }
      toast({ title: "Talle asignado", description: `Talle ${talleElegido} aplicado.` });
      return next;
    });
  };

  const removeItem = (id: string, size: string | undefined) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.size === size)));
  };

  const clearCart = () => setCart([]);

  // Totales (SIN impuestos)
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = 0;                 // <- eliminado
  const total = subtotal;        // <- total = solo productos


  const handleCheckout = async () => {
    // 1) Bloqueo por talles pendientes
    if (hasPending) {
      toast({
        variant: "destructive",
        title: "Faltan talles",
        description: "Asigná los talles pendientes antes de continuar.",
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      // 2) Traemos productos una sola vez y validamos stock
      const productosByDoc: Record<string, any> = {};

      for (const item of cart) {
        if (!item.size) {
          await Swal.fire({
            icon: "error",
            title: "Falta seleccionar talle",
            text: `El producto ${item.name} no tiene talle asignado.`,
            confirmButtonText: "Aceptar",
          });
          setIsCheckingOut(false);
          return;
        }

        const res = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}&populate=*`
        );
        const data = await res.json();
        const producto = data?.data?.[0];

        if (!producto) {
          throw new Error(`Producto no encontrado: ${item.documentId}`);
        }

        productosByDoc[item.documentId] = producto;

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

      // 3) Crear orden (con logs)
      const fecha = new Date().toISOString();
      const ordenPayload = {
        data: {
          total,
          estado: "procesando",
          tipo_venta: "mostrador",
          fecha,
          // si tenés cliente, conectalo así:
          fortela_cliente: { connect: [Number(3)] },
        },
      };

      console.log("📦 Orden - payload:", ordenPayload);

      const ordenRes = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenPayload),
      });

      const ordenJson = await ordenRes.json();
      console.log("📦 Orden - status:", ordenRes.status, "body:", ordenJson);

      if (!ordenRes.ok) {
        await Swal.fire({
          icon: "error",
          title: "Error creando orden",
          html: `<pre style="text-align:left">${JSON.stringify(ordenJson, null, 2)}</pre>`,
        });
        throw new Error("Error al crear la orden");
      }
      const ordenId: number = ordenJson.data.id;
      const ordenDocId: string = ordenJson.data.documentId;


      // 4) Crear items + actualizar stock por talle
      for (const item of cart) {
        // re-fetch del producto (como en el Shop)
        const productoRes = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}&populate=*`
        );
        const productoJson = await productoRes.json();
        const producto = productoJson?.data?.[0];

        if (!producto) {
          throw new Error(`Producto no encontrado: ${item.documentId}`);
        }

        const productoId = Number(producto.id);


        // ...tenés "producto" de Strapi ya con variantesPorTalle y el item del cart...
        const precioVariante =
          Number(item.price ??                      // precio que ya mostrás en el cart (debería venir por talle)
            producto?.variantesPorTalle?.find((v: any) => v.talle === item.size)?.precio ??
            producto?.precio ?? 0);



        // 4.1) crear ítem con ids numéricos (sin connect)
        const itemPayload = {
          data: {
            cantidad: Number(item.quantity),
            talle: item.size,                                  // string
            precio_unitario: precioVariante,                 // << GUARDA el precio por talle
            importe: precioVariante * Number(item.quantity), // << GUARDA el subtotal de la línea
            fortela_producto: Number(productoId),              // número plano
            fortela_orden: Number(ordenId),                    // número plano
          },
        };


        const itemRes = await fetch(
          "https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(itemPayload),
          }
        );
        const itemJson = await itemRes.json();
        if (!itemRes.ok) {
          console.error("🧾 Error item:", itemJson);
          throw new Error(`Error al crear item de orden para ${item.name}`);
        }

        // 4.2) actualizar stock por talle
        const nuevasVariantes = (producto.variantesPorTalle || []).map((v: any) => ({
          talle: v.talle,
          cantidad: v.talle === item.size ? Math.max(0, (v.cantidad ?? 0) - item.quantity) : v.cantidad,
          precio: v.precio,
        }));

        const nuevoStockTotal = nuevasVariantes.reduce(
          (sum: number, v: any) => sum + (v.cantidad ?? 0),
          0
        );

        const putRes = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos/${item.documentId}?populate=*`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              data: {
                variantesPorTalle: nuevasVariantes,
                stock: nuevoStockTotal,
              },
            }),
          }
        );
        const putJson = await putRes.json();
        if (!putRes.ok) {
          console.error("📉 Error PUT stock:", putJson);
          throw new Error(`Error al actualizar stock de ${item.name}`);
        }
      }



      // ----- GUARDAMOS DATOS PARA EL TICKET DEL POS -----
      const itemsForTicket = cart.map((i) => ({
        descripcion: i.name,
        talle: i.size!,                       // ya validaste que no haya pendientes
        cantidad: Number(i.quantity),
        precio: Number(i.price),              // precio por talle que venías usando
        importe: Number(i.price) * Number(i.quantity),
      }));

      // Guardamos en sessionStorage para leerlos en /pos/venta-completada
      if (typeof window !== "undefined") {
        sessionStorage.setItem("posTicketItems", JSON.stringify(itemsForTicket));
        sessionStorage.setItem(
          "posTicketMeta",
          JSON.stringify({
            ordenId: ordenDocId || String(ordenId),  // usamos documentId
            total,
          })
        );
      }




      // 4.3) ✅ NUEVO FLUJO: SweetAlert de éxito y redirección a pantalla de confirmación
      clearCart(); // limpiamos antes de salir
      await Swal.fire({
        icon: "success",
        title: "¡Venta creada correctamente!",
        text: `Orden: ORD-${ordenId}`,
        timer: 1200,
        showConfirmButton: false,
      });

      // Redirigimos a la pantalla con las 2 opciones (volver + imprimir ticket)
      const url = `/pos/venta-completada?ordenId=${encodeURIComponent(ordenDocId)}&total=${encodeURIComponent(total)}`;
      window.location.assign(url);

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
  };



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
                    <div key={`${item.id}-${item.size ?? "pendiente"}-${index}`} className="space-y-2">
                      {/* DONDE renderizás cada item del carrito */}
                      <POSCartItem
                        item={item as any}
                        onIncrement={() => updateQuantity(item.id, item.size, 1)}
                        onDecrement={() => updateQuantity(item.id, item.size, -1)}
                        onRemove={() => removeItem(item.id, item.size)}
                        // onChangeSize={(newSize) => handleAsignarTalle(item as any, newSize)}  // <- QUITALO si no querés cambios individuales
                        inlineSizeSelector={false} // <- NUEVO: oculta el select inline
                      />


                      {/* Botón para abrir el selector múltiple de talles */}
                      {item.variantes?.length ? (
                        <div className="flex justify-start pl-2">
                          <Button variant="outline" size="sm" onClick={() => openSizePicker(item)}>
                            Elegir talles
                          </Button>
                        </div>
                      ) : null}

                    </div>
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
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span><span>${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full mb-3"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || hasPending}
                    title={hasPending ? "Asigná los talles pendientes antes de continuar" : undefined}
                  >
                    {isCheckingOut ? "Procesando..." : hasPending ? "Asigná talles pendientes" : "Confirmar Venta"}
                    {!isCheckingOut && !hasPending && <CreditCard className="ml-2 h-4 w-4" />}
                  </Button>


                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {sizePickerItem && (
        <Dialog open={!!sizePickerItem} onOpenChange={(o) => !o && setSizePickerItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Elegir talles para {sizePickerItem.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
              {sizePickerItem.variantes?.map((v) => {
                const actual = cartSizeSelections[v.talle] ?? 0;
                const max = v.cantidad ?? 0;
                return (
                  <div key={v.talle} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex flex-col">
                      <span className="font-medium capitalize">
                        Talle {v.talle}{typeof v.precio === "number" ? ` • $${v.precio.toFixed(2)}` : ""}
                      </span>
                      <span className="text-sm text-muted-foreground">Stock: {max}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => decCartPicker(v.talle)} disabled={actual <= 0}>-</Button>
                      <input
                        type="number"
                        inputMode="numeric"
                        className="w-16 text-center rounded-md border px-2 py-1 bg-background"
                        min={0}
                        max={max}
                        value={actual}
                        onChange={(e) => setCartPickerQty(v.talle, Number(e.target.value), max)}
                      />
                      <Button variant="outline" size="icon" onClick={() => incCartPicker(v.talle, max)} disabled={actual >= max}>+</Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={applyCartSizeSelections} className="w-full mt-2">
              Aplicar
            </Button>
          </DialogContent>
        </Dialog>
      )}


      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccioná talles y cantidades</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
            {variantes.map((v: any) => {
              const actual = selecciones[v.talle] ?? 0;
              const max = v.cantidad ?? 0;
              return (
                <div
                  key={v.talle}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium capitalize">
                      Talle {v.talle} {typeof v.precio === "number" ? `• $${v.precio.toFixed(2)}` : ""}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Stock: {max} disponible{max !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => decTalle(v.talle)}
                      disabled={actual <= 0}
                      aria-label={`Quitar talle ${v.talle}`}
                    >
                      -
                    </Button>
                    <input
                      inputMode="numeric"
                      type="number"
                      className="w-16 text-center rounded-md border px-2 py-1 bg-background"
                      min={0}
                      max={max}
                      value={actual}
                      onChange={(e) => setCantidadTalle(v.talle, Number(e.target.value), max)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => incTalle(v.talle, max)}
                      disabled={actual >= max}
                      aria-label={`Agregar talle ${v.talle}`}
                    >
                      +
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={confirmarSelecciones} className="w-full mt-4">
            Confirmar selección
          </Button>
          <Button variant="ghost" onClick={continuarSinTalle} className="w-full">
            Continuar sin talle (elegir luego)
          </Button>
        </DialogContent>
      </Dialog>

    </div >
  );
}
