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


interface VarianteTalle { talle: string; cantidad: number; precio?: number }
interface ColegioBlock { colegio: string; variantesPorTalles: VarianteTalle[] }

interface POSItem {
  id: string;
  documentId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;                 // talle
  colegio?: string;              // NUEVO
  qr_code: string;
  stock: number;                 // stock de la variante elegida
  totalStock: number;            // stock total del producto
  pendingSize?: boolean;
  variantes?: VarianteTalle[];                // legacy (sin colegio)
  variantesPorColegio?: ColegioBlock[];       // NUEVO
}



const QRScanner = dynamic(() => import("@/components/admin/qr-scanner"), { ssr: false });

export default function POSPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [cart, setCart] = useState<POSItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

  // Modal de escaneo/selección
  const [productoActual, setProductoActual] = useState<any | null>(null);
  const [variantes, setVariantes] = useState<VarianteTalle[]>([]); // talles del colegio elegido o legacy
  const [selectedColegio, setSelectedColegio] = useState<string>(""); // NUEVO
  const [selecciones, setSelecciones] = useState<Record<string, number>>({});

  // item que está editando talles en el carrito
  const [sizePickerItem, setSizePickerItem] = useState<POSItem | null>(null);

  // cantidades por talle para el picker del carrito
  const [cartSizeSelections, setCartSizeSelections] = useState<Record<string, number>>({});

  const router = useRouter();





  const handleScan = async (code: string) => {
    setIsScanning(false);
    try {
      const res = await fetch(
        `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${code}&populate[variantesPorColegio][populate]=*&populate=variantesPorTalle`
      );
      const data = await res.json();
      const item = data?.data?.[0];
      if (!item) {
        toast({ variant: "destructive", title: "Producto no encontrado", description: `ID: ${code}` });
        return;
      }

      const vpc: ColegioBlock[] = Array.isArray(item.variantesPorColegio) ? item.variantesPorColegio : [];
      const legacy: VarianteTalle[] = Array.isArray(item.variantesPorTalle) ? item.variantesPorTalle : [];

      setProductoActual({ ...item, totalStock: item.stock, variantesPorColegio: vpc, variantes: legacy });

      if (vpc.length > 0) {
        // flujo nuevo: arrancamos con el primer colegio
        const first = vpc[0];
        setSelectedColegio(first.colegio);
        setVariantes(first.variantesPorTalles || []);
        setSelecciones(Object.fromEntries((first.variantesPorTalles || []).map((v: any) => [v.talle, 0])));
      } else if (legacy.length > 0) {
        setSelectedColegio(""); // no aplica
        setVariantes(legacy);
        setSelecciones(Object.fromEntries(legacy.map((v: any) => [v.talle, 0])));
      } else {
        toast({ variant: "destructive", title: "Sin stock disponible" });
        return;
      }
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
    // ⬇️ si el item tiene colegio, tomar los talles de ese colegio;
    // si no, usar legacy variantes
    let talles: VarianteTalle[] = [];
    if (item.variantesPorColegio?.length && item.colegio) {
      talles = item.variantesPorColegio.find(c => c.colegio === item.colegio)?.variantesPorTalles || [];
    } else {
      talles = item.variantes || [];
    }

    const base: Record<string, number> = {};
    talles.forEach(v => { base[v.talle] = 0; });

    setCartSizeSelections(base);
    // ⬇️ asegurar que el picker reciba los talles correctos
    setSizePickerItem({ ...item, variantes: talles });
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

        // clave por producto + colegio + talle
        const same = updated.find(i =>
          i.qr_code === productoActual.documentId &&
          i.size === v.talle &&
          (i.colegio ?? "") === (productoActual.variantesPorColegio?.length ? selectedColegio : "")
        );
        const yaAgregado = same ? same.quantity : 0;
        const disponible = v.cantidad ?? 0;

        if (qty + yaAgregado > disponible) {
          toast({
            variant: "destructive",
            title: "Stock insuficiente",
            description: `Talle ${v.talle}: pediste ${qty + yaAgregado} y hay ${disponible}.`
          });
          continue;
        }

        const baseItem: POSItem = {
          id: productoActual.id.toString(),
          documentId: productoActual.documentId,
          name: productoActual.nombre,
          price,
          size: v.talle,
          colegio: productoActual.variantesPorColegio?.length ? selectedColegio : undefined,
          qr_code: productoActual.documentId,
          quantity: qty,
          stock: disponible,
          totalStock: productoActual.totalStock || 0,
          variantes: productoActual.variantes || [],
          variantesPorColegio: productoActual.variantesPorColegio || [],
        };

        if (same) {
          updated = updated.map(i =>
            i === same ? { ...i, quantity: i.quantity + qty } : i
          );
        } else {
          updated.push(baseItem);
        }

        agregoAlgo = true;
      }

      if (agregoAlgo && sizePickerItem?.pendingSize) {
        updated = updated.filter(p =>
          !(
            p.qr_code === (sizePickerItem as POSItem).qr_code &&
            (p.colegio ?? "") === ((sizePickerItem as POSItem).colegio ?? "") &&
            !p.size && p.pendingSize
          )
        );
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
    if (!productoActual) return;

    // total de stock sumando todas las variantes
    const totalStock =
      (productoActual.variantesPorColegio?.length
        ? productoActual.variantesPorColegio.flatMap((c: any) => c.variantesPorTalles || [])
        : productoActual.variantes || []
      ).reduce((s: number, v: any) => s + (v.cantidad ?? 0), 0);

    // ⬇️ talles a guardar dentro del item (colegio → talles, o legacy)
    const tallesParaItem: VarianteTalle[] =
      productoActual.variantesPorColegio?.length
        ? (productoActual.variantesPorColegio.find((c: any) => c.colegio === selectedColegio)?.variantesPorTalles || [])
        : (productoActual.variantes || []);

    const productPendiente: POSItem = {
      id: productoActual.id.toString(),
      documentId: productoActual.documentId,
      name: productoActual.nombre,
      price: productoActual.precio ?? 0,
      size: undefined,
      colegio: productoActual.variantesPorColegio?.length ? selectedColegio : undefined, // ✅ colegio guardado
      qr_code: productoActual.documentId,
      quantity: 1,
      stock: totalStock,
      totalStock,
      pendingSize: true,
      variantes: tallesParaItem,                       // ✅ talles del colegio seleccionado
      variantesPorColegio: productoActual.variantesPorColegio || [],
    };

    setCart(prev => [...prev, productPendiente]);
    toast({ title: "Producto agregado", description: `${productPendiente.name} (talle/cole pendiente)` });
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
        if (qty < 0) continue;

        const existingIdx = updated.findIndex(i =>
          i.qr_code === sizePickerItem.qr_code &&
          i.size === v.talle &&
          (i.colegio ?? "") === (sizePickerItem.colegio ?? "")
        );

        const disponible = Number(v.cantidad ?? 0);
        const esMismoTalleQueEdito = !!sizePickerItem.size && v.talle === sizePickerItem.size;

        if (qty > 0) {
          if (qty > disponible) {
            toast({
              variant: "destructive",
              title: "Stock insuficiente",
              description: `Talle ${v.talle}: pediste ${qty} y hay ${disponible}.`
            });
            continue;
          }

          const price = typeof v.precio === "number" ? v.precio : sizePickerItem.price;

          if (existingIdx >= 0) {
            // Reemplazo/seteo cantidad y aseguro conservar colegio y variantes para que siga el botón
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: esMismoTalleQueEdito ? qty : (updated[existingIdx].quantity + qty),
              price,
              colegio: sizePickerItem.colegio ?? updated[existingIdx].colegio,
              variantesPorColegio: sizePickerItem.variantesPorColegio || updated[existingIdx].variantesPorColegio || [],
              variantes: sizePickerItem.variantes || updated[existingIdx].variantes || [],
            };
          } else {
            // Nueva línea: incluir colegio y variantes para habilitar “Elegir / cambiar talles”
            updated.push({
              id: sizePickerItem.id,
              documentId: sizePickerItem.documentId,
              name: sizePickerItem.name,
              price,
              size: v.talle,
              colegio: sizePickerItem.colegio,                               // ✅ colegio
              qr_code: sizePickerItem.qr_code,
              quantity: qty,
              stock: disponible,
              totalStock: sizePickerItem.totalStock,
              variantesPorColegio: sizePickerItem.variantesPorColegio || [],  // ✅ deja el botón activo
              variantes: sizePickerItem.variantes || [],                      // (en legacy sirve esto)
            } as POSItem);
          }

          agregoAlgo = true;
        }
      }

      // Si venía de línea PENDIENTE → borrarla por claves
      if (agregoAlgo && sizePickerItem?.pendingSize) {
        updated = updated.filter(p =>
          !(
            p.qr_code === sizePickerItem.qr_code &&
            (p.colegio ?? "") === (sizePickerItem.colegio ?? "") &&
            !p.size && p.pendingSize
          )
        );
      }

      // Si edité una línea con talle y la dejé en 0 → eliminar original
      if (sizePickerItem?.size) {
        const qtyOriginal = cartSizeSelections[sizePickerItem.size] ?? 0;
        if (qtyOriginal === 0) {
          updated = updated.filter(p =>
            !(
              p.qr_code === sizePickerItem.qr_code &&
              (p.colegio ?? "") === (sizePickerItem.colegio ?? "") &&
              p.size === sizePickerItem.size
            )
          );
        }
      }

      return updated;
    });

    if (agregoAlgo) {
      toast({ title: "Talles aplicados", description: "Se actualizó el carrito." });
    } else {
      toast({ variant: "destructive", title: "Sin cambios", description: "No seleccionaste cantidades." });
    }

    setSizePickerItem(null);
    setCartSizeSelections({});
  };


  const onChangeColegioEnModal = (colegio: string) => {
    if (!productoActual?.variantesPorColegio?.length) return;
    const block = productoActual.variantesPorColegio.find((c: any) => c.colegio === colegio);
    setSelectedColegio(colegio);
    const talles = block?.variantesPorTalles || [];
    setVariantes(talles);
    setSelecciones(Object.fromEntries(talles.map((v: any) => [v.talle, 0])));
  };

  const updateQuantity = (id: string, size: string | undefined, amount: number, colegio?: string) => {
    setCart(prev => prev.map(i => {
      if (i.id === id && i.size === size && (i.colegio ?? "") === (colegio ?? "")) {
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

  const removeItem = (id: string, size: string | undefined, colegio?: string) => {
    setCart(prev => prev.filter(i => !(i.id === id && i.size === size && (i.colegio ?? "") === (colegio ?? ""))));
  };

  const totalSeleccionado = Object.values(selecciones).reduce((a, b) => a + (b || 0), 0);


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

    // helper: normaliza respuesta de Strapi (v4/v5) para tener campos planos y id numérico
    const normalizeProducto = (raw: any) => {
      if (!raw) return null;
      if (raw.attributes) {
        // estructura { id, attributes: {...} }
        return {
          id: raw.id, // <-- numérico real de Strapi
          documentId: raw.documentId ?? raw.attributes.documentId,
          precio: raw.attributes.precio,
          variantesPorColegio: raw.attributes.variantesPorColegio ?? [],
          variantesPorTalle: raw.attributes.variantesPorTalle ?? [],
          stock: raw.attributes.stock,
          nombre: raw.attributes.nombre,
        };
      }
      // estructura plana (id/documentId en top-level)
      return {
        id: raw.id, // <-- numérico real de Strapi
        documentId: raw.documentId,
        precio: raw.precio,
        variantesPorColegio: raw.variantesPorColegio ?? [],
        variantesPorTalle: raw.variantesPorTalle ?? [],
        stock: raw.stock,
        nombre: raw.nombre,
      };
    };



    // --- Helpers de depuración (modal con payload/response) ---
    const escapeHtml = (value: any) =>
      String(typeof value === "string" ? value : JSON.stringify(value, null, 2))
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const showDebugModal = async (
      title: string,
      payload: any,
      response: any,
      extra?: Record<string, any>
    ) => {
      const html = `
  <div style="text-align:left;max-height:70vh;overflow:auto">
    ${extra ? `<h3 style="margin:6px 0">Contexto</h3>
    <pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:6px">${escapeHtml(extra)}</pre>` : ""}

    <h3 style="margin:6px 0">Payload enviado</h3>
    <pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:6px">${escapeHtml(payload)}</pre>

    <h3 style="margin:6px 0">Respuesta</h3>
    <pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:6px">${escapeHtml(response)}</pre>
  </div>
`;
      await Swal.fire({
        icon: "error",
        title,
        html,
        width: 900,
        confirmButtonText: "Cerrar",
      });
    };


    try {
      // 2) Traemos productos una sola vez y validamos stock (soporta colegio → talles y legacy)
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

        // Traer variantes anidadas
        const res = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}&populate[variantesPorColegio][populate]=*&populate=variantesPorTalle`
        );
        const data = await res.json();
        const raw = data?.data?.[0];
        if (!raw) throw new Error(`Producto no encontrado: ${item.documentId}`);

        const producto = normalizeProducto(raw);
        if (!producto?.id || Number.isNaN(Number(producto.id))) {
          throw new Error(`Producto sin id (Strapi) válido: ${item.documentId}`);
        }

        productosByDoc[item.documentId] = producto;

        // Validación de stock por colegio+talle o legacy
        let stockDisponible = 0;
        if (Array.isArray(producto.variantesPorColegio) && producto.variantesPorColegio.length) {
          if (!item.colegio) {
            await Swal.fire({
              icon: "error",
              title: "Falta seleccionar colegio",
              text: `El producto ${item.name} requiere colegio.`,
              confirmButtonText: "Aceptar",
            });
            setIsCheckingOut(false);
            return;
          }
          const block = producto.variantesPorColegio.find((c: any) => c.colegio === item.colegio);
          const varT = block?.variantesPorTalles?.find((v: any) => v.talle === item.size);
          stockDisponible = Number(varT?.cantidad ?? 0);
        } else {
          const varT = (producto.variantesPorTalle || []).find((v: any) => v.talle === item.size);
          stockDisponible = Number(varT?.cantidad ?? 0);
        }

        if (item.quantity > stockDisponible) {
          await Swal.fire({
            icon: "error",
            title: "Stock insuficiente",
            text: `${item.name} (${item.colegio ?? "sin colegio"} • ${item.size}) tiene solo ${stockDisponible} unidad(es).`,
            confirmButtonText: "Aceptar",
          });
          setIsCheckingOut(false);
          return;
        }
      }

      // 3) Crear orden
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

      const ordenRes = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordenPayload),
      });
      const ordenJson = await ordenRes.json();
      if (!ordenRes.ok) {
        await showDebugModal(
          "Error creando orden",
          ordenPayload,
          ordenJson,
          { endpoint: "POST /api/fortela-ordenes" }
        );
        throw new Error("Error al crear la orden");
      }

      const ordenId: number = ordenJson.data.id;
      const ordenDocId: string = ordenJson.data.documentId;

      // 4) Crear items + actualizar stock por talle (colegio o legacy)
      for (const item of cart) {
        const producto = productosByDoc[item.documentId];

        // Precio por talla (respeta precio de la variante si existe)
        let precioVariante = Number(item.price ?? 0);
        if (!precioVariante) {
          if (Array.isArray(producto.variantesPorColegio) && producto.variantesPorColegio.length) {
            const block = producto.variantesPorColegio.find((c: any) => c.colegio === item.colegio);
            precioVariante = Number(
              block?.variantesPorTalles?.find((v: any) => v.talle === item.size)?.precio ?? producto?.precio ?? 0
            );
          } else {
            precioVariante = Number(
              (producto.variantesPorTalle || []).find((v: any) => v.talle === item.size)?.precio ?? producto?.precio ?? 0
            );
          }
        }

        // 4.1) crear ítem (agregar colegio si existe)
        const itemPayload = {
          data: {
            cantidad: Number(item.quantity),
            talle: String(item.size),
            ...(item.colegio ? { colegio: String(item.colegio) } : {}), // ⬅️ NUEVO

            precio_unitario: Number(precioVariante),
            importe: Number(precioVariante) * Number(item.quantity),

            // Relaciones por documentId (Strapi v5)
            fortela_producto: { connect: [{ documentId: producto.documentId }] },
            fortela_orden: { connect: [{ documentId: ordenDocId }] },
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
          // Logs a consola igualmente
          console.error("🧾 Error ítem (payload):", JSON.stringify(itemPayload, null, 2));
          console.error("🧾 Error ítem (Strapi):", itemJson?.error || itemJson);

          await showDebugModal(
            `Error al crear ítem: ${item.name}`,
            itemPayload,
            itemJson,
            {
              endpoint: "POST /api/fortela-items-comprados",
              productoIdConectado: Number(producto.id),
              ordenIdConectado: Number(ordenId),
              itemDocumentId: item.documentId,
              itemColegio: item.colegio ?? null,
              itemTalle: item.size ?? null,
              itemCantidad: Number(item.quantity),
            }
          );

          throw new Error(
            `Error al crear item de orden para ${item.name} → ${itemJson?.error?.message ?? "ver modal"}`
          );
        }


        // 4.2) actualizar stock en el producto
        let dataPut: any = {};

        if (Array.isArray(producto.variantesPorColegio) && producto.variantesPorColegio.length) {
          const nuevasVpc = producto.variantesPorColegio.map((c: any) => {
            if (c.colegio !== item.colegio) {
              // copiar tal cual
              return {
                colegio: c.colegio,
                variantesPorTalles: (c.variantesPorTalles || []).map((v: any) => ({
                  talle: v.talle,
                  cantidad: Number(v.cantidad ?? 0),
                  precio: v.precio,
                })),
              };
            }
            // descontar en el talle elegido
            return {
              colegio: c.colegio,
              variantesPorTalles: (c.variantesPorTalles || []).map((v: any) => ({
                talle: v.talle,
                cantidad:
                  v.talle === item.size
                    ? Math.max(0, Number(v.cantidad ?? 0) - Number(item.quantity))
                    : Number(v.cantidad ?? 0),
                precio: v.precio,
              })),
            };
          });

          const nuevoTotal = nuevasVpc
            .flatMap((c: any) => c.variantesPorTalles)
            .reduce((s: number, v: any) => s + Number(v.cantidad ?? 0), 0);

          // ✅ Actualizar cache local antes del PUT (evita pisar descuentos previos del mismo producto)
          productosByDoc[item.documentId] = {
            ...producto,
            variantesPorColegio: nuevasVpc,
            stock: nuevoTotal,
          };

          dataPut = { variantesPorColegio: nuevasVpc, stock: nuevoTotal };
        } else {
          const nuevasVpt = (producto.variantesPorTalle || []).map((v: any) => ({
            talle: v.talle,
            cantidad:
              v.talle === item.size
                ? Math.max(0, Number(v.cantidad ?? 0) - Number(item.quantity))
                : Number(v.cantidad ?? 0),
            precio: v.precio,
          }));

          const nuevoTotal = nuevasVpt.reduce((s: number, v: any) => s + Number(v.cantidad ?? 0), 0);

          // ✅ Actualizar cache local antes del PUT (evita pisar descuentos previos del mismo producto)
          productosByDoc[item.documentId] = {
            ...producto,
            variantesPorTalle: nuevasVpt,
            stock: nuevoTotal,
          };

          dataPut = { variantesPorTalle: nuevasVpt, stock: nuevoTotal };
        }

        const putRes = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos/${item.documentId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: dataPut }),
          }
        );
        const putJson = await putRes.json();
        if (!putRes.ok) {
          console.error("📉 Error PUT stock (request):", { data: dataPut });
          console.error("📉 Error PUT stock (response):", putJson);

          await showDebugModal(
            `Error al actualizar stock de ${item.name}`,
            { data: dataPut },
            putJson,
            {
              endpoint: `PUT /api/productos/${item.documentId} (por documentId)`,
              colegio: item.colegio ?? null,
              talle: item.size ?? null,
              cantidadVendida: Number(item.quantity),
            }
          );

          throw new Error(`Error al actualizar stock de ${item.name}`);
        }


      }

      // 5) Guardar datos de ticket (agrego colegio para claridad)
      const itemsForTicket = cart.map((i) => ({
        descripcion: i.name,
        colegio: i.colegio ?? null, // opcional en ticket
        talle: i.size!, // ya validado
        cantidad: Number(i.quantity),
        precio: Number(i.price),
        importe: Number(i.price) * Number(i.quantity),
      }));

      if (typeof window !== "undefined") {
        sessionStorage.setItem("posTicketItems", JSON.stringify(itemsForTicket));
        sessionStorage.setItem(
          "posTicketMeta",
          JSON.stringify({
            ordenId: ordenDocId || String(ordenId),
            total,
          })
        );
      }

      // 6) Éxito
      clearCart();
      await Swal.fire({
        icon: "success",
        title: "¡Venta creada correctamente!",
        text: `Orden: ORD-${ordenId}`,
        timer: 1200,
        showConfirmButton: false,
      });

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
                        onIncrement={() => updateQuantity(item.id, item.size, 1, item.colegio)}
                        onDecrement={() => updateQuantity(item.id, item.size, -1, item.colegio)}
                        onRemove={() => removeItem(item.id, item.size, item.colegio)}
                        inlineSizeSelector={false}
                      />



                      {/* Botón para abrir el selector múltiple de talles */}
                      {(item.variantes?.length || (item.variantesPorColegio?.length && item.colegio)) ? (
                        <div className="flex justify-start pl-2">
                          <Button variant="outline" size="sm" onClick={() => openSizePicker(item)}>
                            Elegir / cambiar talles
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



          {productoActual?.variantesPorColegio?.length ? (
            <div className="mb-3">
              <label className="text-sm text-muted-foreground mb-1 block">Colegio</label>
              <select
                className="border rounded-md px-2 py-1 bg-background text-sm w-full"
                value={selectedColegio}
                onChange={(e) => onChangeColegioEnModal(e.target.value)}
              >
                {productoActual.variantesPorColegio.map((c: any) => (
                  <option key={c.colegio} value={c.colegio}>{c.colegio}</option>
                ))}
              </select>
            </div>
          ) : null}


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
