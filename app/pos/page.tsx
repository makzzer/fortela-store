"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import POSCartItem from "@/components/pos/pos-cart-item";
import ProductTableSelector from "@/components/pos/ProductTableSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Scan, ShoppingCart, CreditCard, Trash2, Table2, AlertCircle, ChevronRight
} from "lucide-react";
import Swal from "sweetalert2";
import { useProductos } from "@/app/context/ProductosContext";
import { useRouter } from "next/navigation";

const QRScanner = dynamic(() => import("@/components/admin/qr-scanner"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

interface VarianteTalle { talle: string; cantidad: number; precio?: number }
interface ColegioBlock { colegio: string; variantesPorTalles: VarianteTalle[] }
interface VarianteBasico { color?: string; detalle?: string; talle?: string; cantidad: number; precio?: number }

interface POSItem {
  id: string;
  documentId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  colegio?: string;
  color?: string;         // ← para variantesBasico
  detalle?: string;       // ← para variantesBasico
  qr_code: string;
  stock: number;
  totalStock: number;
  pendingSize?: boolean;
  variantes?: VarianteTalle[];
  variantesPorColegio?: ColegioBlock[];
  variantesBasico?: VarianteBasico[];
}

type ActiveTab = "table" | "scan";

// Colores predefinidos
const COLORES_PREDEFINIDOS = ["azul", "rojo", "verde", "gris"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function POSPage() {
  const productos = useProductos();           // ← devuelve Producto[] directamente
  const { toast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("table");
  const [isScanning, setIsScanning] = useState(false);

  const [cart, setCart] = useState<POSItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Modal talle/colegio
  const [showModal, setShowModal] = useState(false);
  const [productoActual, setProductoActual] = useState<any | null>(null);
  const [variantes, setVariantes] = useState<VarianteTalle[]>([]);
  const [selectedColegio, setSelectedColegio] = useState<string>("");
  const [selecciones, setSelecciones] = useState<Record<string, number>>({});

  // Modal variantesBasico (color/detalle)
  const [showBasicoModal, setShowBasicoModal] = useState(false);
  const [productoBasicoActual, setProductoBasicoActual] = useState<any | null>(null);
  const [seleccionesBasico, setSeleccionesBasico] = useState<Record<string, number>>({});

  // Cart size picker
  const [sizePickerItem, setSizePickerItem] = useState<POSItem | null>(null);
  const [cartSizeSelections, setCartSizeSelections] = useState<Record<string, number>>({});

  // ─── Derived ──────────────────────────────────────────────────────────────

  const hasPending = cart.some(i => i.pendingSize);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal;

  // ─── Open product modal ───────────────────────────────────────────────────

  const openProductModal = useCallback((item: any) => {
    const vpc: ColegioBlock[] = Array.isArray(item.variantesPorColegio) ? item.variantesPorColegio : [];
    const legacy: VarianteTalle[] = Array.isArray(item.variantesPorTalle)
      ? item.variantesPorTalle
      : Array.isArray(item.variantes) ? item.variantes : [];
    const basico: VarianteBasico[] = Array.isArray(item.variantesBasico) ? item.variantesBasico : [];

    setProductoActual({ ...item, totalStock: item.stock, variantesPorColegio: vpc, variantes: legacy, variantesBasico: basico });

    if (vpc.length > 0) {
      const first = vpc[0];
      setSelectedColegio(first.colegio);
      setVariantes(first.variantesPorTalles || []);
      setSelecciones(Object.fromEntries((first.variantesPorTalles || []).map((v: any) => [v.talle, 0])));
      setShowModal(true);
    } else if (legacy.length > 0) {
      setSelectedColegio("");
      setVariantes(legacy);
      setSelecciones(Object.fromEntries(legacy.map((v: any) => [v.talle, 0])));
      setShowModal(true);
    } else if (basico.length > 0) {
      // Producto básico con variantes de color/detalle → abrir modal de color
      setProductoBasicoActual({ ...item, variantesBasico: basico });
      const initSel: Record<string, number> = {};
      basico.forEach((v: VarianteBasico) => {
        const key = v.color || v.detalle || "";
        initSel[key] = 0;
      });
      setSeleccionesBasico(initSel);
      setShowBasicoModal(true);
    } else {
      // Producto básico sin variantes → agregar directo, acumulable
      const basicItem: POSItem = {
        id: String(item.id ?? item.documentId),
        documentId: item.documentId,
        name: item.nombre,
        price: item.precio ?? 0,
        quantity: 1,
        qr_code: item.documentId,
        stock: item.stock ?? 999,
        totalStock: item.stock ?? 999,
        variantes: [],
        variantesPorColegio: [],
        variantesBasico: [],
      };
      setCart(prev => {
        const existing = prev.find(
          c => c.qr_code === basicItem.qr_code && !c.size && !c.colegio && !c.color && !c.pendingSize
        );
        if (existing) {
          return prev.map(c => c === existing ? { ...c, quantity: c.quantity + 1 } : c);
        }
        return [...prev, basicItem];
      });
      toast({ title: "Producto agregado", description: basicItem.name });
    }
  }, [toast]);

  // ─── QR Scan ──────────────────────────────────────────────────────────────

  const handleScan = async (code: string) => {
    setIsScanning(false);
    try {
      const res = await fetch(
        `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${code}&populate[variantesPorColegio][populate]=*&populate[variantesPorTalle]=*&populate[variantesBasico]=*`
      );
      const data = await res.json();
      const item = data?.data?.[0];
      if (!item) {
        toast({ variant: "destructive", title: "Producto no encontrado", description: `ID: ${code}` });
        return;
      }
      openProductModal(item);
    } catch {
      toast({ variant: "destructive", title: "Error al escanear producto" });
    }
  };

  // ─── Table select ──────────────────────────────────────────────────────────

  const handleSelectFromTable = useCallback((producto: any) => {
    openProductModal(producto);
  }, [openProductModal]);

  // ─── Modal: talle helpers ──────────────────────────────────────────────────

  const setCantidadTalle = (talle: string, cantidad: number, stockMax: number) => {
    setSelecciones(prev => ({ ...prev, [talle]: Math.max(0, Math.min(stockMax, cantidad)) }));
  };
  const incTalle = (talle: string, stockMax: number) => {
    setSelecciones(prev => ({ ...prev, [talle]: Math.min(stockMax, (prev[talle] ?? 0) + 1) }));
  };
  const decTalle = (talle: string) => {
    setSelecciones(prev => ({ ...prev, [talle]: Math.max(0, (prev[talle] ?? 0) - 1) }));
  };
  const totalSeleccionado = Object.values(selecciones).reduce((a, b) => a + (b || 0), 0);

  const onChangeColegioEnModal = (colegio: string) => {
    if (!productoActual?.variantesPorColegio?.length) return;
    const block = productoActual.variantesPorColegio.find((c: any) => c.colegio === colegio);
    setSelectedColegio(colegio);
    const talles = block?.variantesPorTalles || [];
    setVariantes(talles);
    setSelecciones(Object.fromEntries(talles.map((v: any) => [v.talle, 0])));
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
        const colegioKey = productoActual.variantesPorColegio?.length ? selectedColegio : "";

        const same = updated.find(i =>
          i.qr_code === productoActual.documentId &&
          i.size === v.talle &&
          (i.colegio ?? "") === colegioKey
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
          id: String(productoActual.id ?? productoActual.documentId),
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
          variantesBasico: [],
        };

        if (same) {
          updated = updated.map(i => i === same ? { ...i, quantity: i.quantity + qty } : i);
        } else {
          updated.push(baseItem);
        }
        agregoAlgo = true;
      }
      return updated;
    });

    toast({
      title: agregoAlgo ? "Productos agregados" : "Sin cambios",
      description: agregoAlgo ? "Se añadieron los talles seleccionados." : "No seleccionaste ningún talle.",
      variant: agregoAlgo ? "default" : "destructive"
    });
    setShowModal(false);
    setSelecciones({});
  };

  const continuarSinTalle = () => {
    if (!productoActual) return;

    const totalStock = (productoActual.variantesPorColegio?.length
      ? productoActual.variantesPorColegio.flatMap((c: any) => c.variantesPorTalles || [])
      : productoActual.variantes || []
    ).reduce((s: number, v: any) => s + (v.cantidad ?? 0), 0);

    const tallesParaItem: VarianteTalle[] = productoActual.variantesPorColegio?.length
      ? (productoActual.variantesPorColegio.find((c: any) => c.colegio === selectedColegio)?.variantesPorTalles || [])
      : (productoActual.variantes || []);

    const productPendiente: POSItem = {
      id: String(productoActual.id ?? productoActual.documentId),
      documentId: productoActual.documentId,
      name: productoActual.nombre,
      price: productoActual.precio ?? 0,
      qr_code: productoActual.documentId,
      quantity: 1,
      stock: totalStock,
      totalStock,
      pendingSize: true,
      colegio: productoActual.variantesPorColegio?.length ? selectedColegio : undefined,
      variantes: tallesParaItem,
      variantesPorColegio: productoActual.variantesPorColegio || [],
      variantesBasico: [],
    };

    setCart(prev => [...prev, productPendiente]);
    toast({ title: "Producto agregado", description: `${productPendiente.name} (talle pendiente)` });
    setShowModal(false);
    setSelecciones({});
  };

  // ─── Modal: variantesBasico (color/detalle) ───────────────────────────────

  const confirmarBasico = () => {
    if (!productoBasicoActual) return;
    let agregoAlgo = false;

    setCart(prev => {
      let updated = [...prev];
      const basico: VarianteBasico[] = productoBasicoActual.variantesBasico || [];

      for (const v of basico) {
        const base = v.color || v.detalle || "";
        const key = v.talle ? `${base}__${v.talle}` : base;
        const qty = seleccionesBasico[key] ?? 0;
        if (qty <= 0) continue;

        const disponible = v.cantidad ?? 0;
        const price = typeof v.precio === "number" ? v.precio : (productoBasicoActual.precio ?? 0);

        const same = updated.find(i =>
          i.qr_code === productoBasicoActual.documentId &&
          (i.color ?? "") === (v.color ?? "") &&
          (i.detalle ?? "") === (v.detalle ?? "") &&
          (i.size ?? "") === (v.talle ?? "")
        );
        const yaAgregado = same ? same.quantity : 0;

        if (qty + yaAgregado > disponible) {
          const displayKey = [v.color || v.detalle, v.talle].filter(Boolean).join(" / ") || key;
          toast({
            variant: "destructive",
            title: "Stock insuficiente",
            description: `${displayKey}: pediste ${qty + yaAgregado} y hay ${disponible}.`
          });
          continue;
        }

        const displayName = [v.color || v.detalle, v.talle].filter(Boolean).join(" / ");
        const newItem: POSItem = {
          id: String(productoBasicoActual.id ?? productoBasicoActual.documentId),
          documentId: productoBasicoActual.documentId,
          name: `${productoBasicoActual.nombre}${displayName ? ` (${displayName})` : ""}`,
          price,
          color: v.color,
          detalle: v.detalle,
          size: v.talle,
          qr_code: productoBasicoActual.documentId,
          quantity: qty,
          stock: disponible,
          totalStock: productoBasicoActual.stock ?? 0,
          variantes: [],
          variantesPorColegio: [],
          variantesBasico: basico,
        };

        if (same) {
          updated = updated.map(i => i === same ? { ...i, quantity: i.quantity + qty } : i);
        } else {
          updated.push(newItem);
        }
        agregoAlgo = true;
      }
      return updated;
    });

    toast({
      title: agregoAlgo ? "Producto agregado" : "Sin cambios",
      description: agregoAlgo ? "Se añadió al carrito." : "No seleccionaste cantidad.",
      variant: agregoAlgo ? "default" : "destructive",
    });
    setShowBasicoModal(false);
    setSeleccionesBasico({});
  };

  // ─── Cart size picker ──────────────────────────────────────────────────────

  const openSizePicker = (item: POSItem) => {
    let talles: VarianteTalle[] = [];
    if (item.variantesPorColegio?.length && item.colegio) {
      talles = item.variantesPorColegio.find(c => c.colegio === item.colegio)?.variantesPorTalles || [];
    } else {
      talles = item.variantes || [];
    }
    const base: Record<string, number> = {};
    talles.forEach(v => { base[v.talle] = 0; });
    setCartSizeSelections(base);
    setSizePickerItem({ ...item, variantes: talles });
  };

  const setCartPickerQty = (talle: string, qty: number, max: number) => {
    setCartSizeSelections(prev => ({ ...prev, [talle]: Math.max(0, Math.min(max, qty)) }));
  };
  const incCartPicker = (talle: string, max: number) => {
    setCartSizeSelections(prev => ({ ...prev, [talle]: Math.min(max, (prev[talle] ?? 0) + 1) }));
  };
  const decCartPicker = (talle: string) => {
    setCartSizeSelections(prev => ({ ...prev, [talle]: Math.max(0, (prev[talle] ?? 0) - 1) }));
  };

  const applyCartSizeSelections = () => {
    if (!sizePickerItem || !(sizePickerItem.variantes?.length)) return;
    const vars = sizePickerItem.variantes;
    let agregoAlgo = false;

    setCart(prev => {
      let updated = [...prev];

      for (const v of vars) {
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
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: esMismoTalleQueEdito ? qty : updated[existingIdx].quantity + qty,
              price,
              colegio: sizePickerItem.colegio ?? updated[existingIdx].colegio,
              variantesPorColegio: sizePickerItem.variantesPorColegio || updated[existingIdx].variantesPorColegio || [],
              variantes: sizePickerItem.variantes || updated[existingIdx].variantes || [],
            };
          } else {
            updated.push({
              id: sizePickerItem.id,
              documentId: sizePickerItem.documentId,
              name: sizePickerItem.name,
              price,
              size: v.talle,
              colegio: sizePickerItem.colegio,
              qr_code: sizePickerItem.qr_code,
              quantity: qty,
              stock: disponible,
              totalStock: sizePickerItem.totalStock,
              variantesPorColegio: sizePickerItem.variantesPorColegio || [],
              variantes: sizePickerItem.variantes || [],
              variantesBasico: [],
            } as POSItem);
          }
          agregoAlgo = true;
        }
      }

      if (agregoAlgo && sizePickerItem?.pendingSize) {
        updated = updated.filter(p =>
          !(p.qr_code === sizePickerItem.qr_code &&
            (p.colegio ?? "") === (sizePickerItem.colegio ?? "") &&
            !p.size && p.pendingSize)
        );
      }

      if (sizePickerItem?.size) {
        const qtyOriginal = cartSizeSelections[sizePickerItem.size] ?? 0;
        if (qtyOriginal === 0) {
          updated = updated.filter(p =>
            !(p.qr_code === sizePickerItem.qr_code &&
              (p.colegio ?? "") === (sizePickerItem.colegio ?? "") &&
              p.size === sizePickerItem.size)
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

  // ─── Cart actions ──────────────────────────────────────────────────────────

  const updateQuantity = (id: string, size: string | undefined, amount: number, colegio?: string, color?: string) => {
    setCart(prev => prev.map(i => {
      if (
        i.id === id &&
        i.size === size &&
        (i.colegio ?? "") === (colegio ?? "") &&
        (i.color ?? "") === (color ?? "")
      ) {
        if (size === undefined && !i.pendingSize && (i.variantes?.length || i.variantesPorColegio?.length)) {
          toast({ variant: "destructive", title: "Elegí un talle primero" });
          return i;
        }
        const nueva = i.quantity + amount;
        if (amount > 0 && i.size && nueva > i.stock) {
          toast({ variant: "destructive", title: "Sin stock suficiente", description: `Solo hay ${i.stock} unidades del talle ${i.size}.` });
          return i;
        }
        return { ...i, quantity: Math.max(1, nueva) };
      }
      return i;
    }));
  };

  const removeItem = (id: string, size: string | undefined, colegio?: string, color?: string) => {
    setCart(prev => prev.filter(i => !(
      i.id === id &&
      i.size === size &&
      (i.colegio ?? "") === (colegio ?? "") &&
      (i.color ?? "") === (color ?? "")
    )));
  };

  const clearCart = () => setCart([]);

  // ─── Checkout ─────────────────────────────────────────────────────────────

  const normalizeProducto = (raw: any) => {
    if (!raw) return null;
    if (raw.attributes) {
      return {
        id: raw.id,
        documentId: raw.documentId ?? raw.attributes.documentId,
        precio: raw.attributes.precio,
        variantesPorColegio: raw.attributes.variantesPorColegio ?? [],
        variantesPorTalle: raw.attributes.variantesPorTalle ?? [],
        variantesBasico: raw.attributes.variantesBasico ?? [],
        stock: raw.attributes.stock,
        nombre: raw.attributes.nombre,
      };
    }
    return {
      id: raw.id,
      documentId: raw.documentId,
      precio: raw.precio,
      variantesPorColegio: raw.variantesPorColegio ?? [],
      variantesPorTalle: raw.variantesPorTalle ?? [],
      variantesBasico: raw.variantesBasico ?? [],
      stock: raw.stock,
      nombre: raw.nombre,
    };
  };

  const escapeHtml = (value: any) =>
    String(typeof value === "string" ? value : JSON.stringify(value, null, 2))
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const showDebugModal = async (title: string, payload: any, response: any, extra?: Record<string, any>) => {
    await Swal.fire({
      icon: "error",
      title,
      html: `<div style="text-align:left;max-height:70vh;overflow:auto">
        ${extra ? `<h3 style="margin:6px 0">Contexto</h3><pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:6px">${escapeHtml(extra)}</pre>` : ""}
        <h3 style="margin:6px 0">Payload</h3><pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:6px">${escapeHtml(payload)}</pre>
        <h3 style="margin:6px 0">Respuesta</h3><pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:10px;border-radius:6px">${escapeHtml(response)}</pre>
      </div>`,
      width: 900,
      confirmButtonText: "Cerrar",
    });
  };

  const handleCheckout = async () => {
    if (hasPending) {
      toast({ variant: "destructive", title: "Faltan talles", description: "Asigná los talles pendientes antes de continuar." });
      return;
    }
    setIsCheckingOut(true);

    try {
      const productosByDoc: Record<string, any> = {};

      for (const item of cart) {
        // isBasicColor = tiene color o detalle (puede tener talle además)
        const isBasicColor = !!(item.color || item.detalle);
        const isBasicPlain = !item.size && !item.variantes?.length && !item.variantesPorColegio?.length && !isBasicColor;

        // Siempre fetch del producto fresco para tener datos actualizados
        const res = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${item.documentId}&populate[variantesPorColegio][populate]=*&populate[variantesPorTalle]=*&populate[variantesBasico]=*`
        );
        const data = await res.json();
        const raw = data?.data?.[0];
        if (!raw) throw new Error(`Producto no encontrado: ${item.documentId}`);

        const producto = normalizeProducto(raw);
        if (!producto?.id || Number.isNaN(Number(producto.id))) {
          throw new Error(`Producto sin id válido: ${item.documentId}`);
        }
        productosByDoc[item.documentId] = producto;

        if (isBasicPlain) continue; // sin stock tracking, skip validación

        if (isBasicColor) {
          // validar stock de la variante color (matchea color + detalle + talle)
          const varB = (producto.variantesBasico || []).find(
            (v: any) =>
              (v.color ?? "") === (item.color ?? "") &&
              (v.detalle ?? "") === (item.detalle ?? "") &&
              (v.talle ?? "") === (item.size ?? "")
          );
          const stockDisponible = Number(varB?.cantidad ?? 0);
          if (item.quantity > stockDisponible) {
            await Swal.fire({
              icon: "error",
              title: "Stock insuficiente",
              text: `${item.name} tiene solo ${stockDisponible} unidad(es).`,
              confirmButtonText: "Aceptar"
            });
            setIsCheckingOut(false);
            return;
          }
          continue;
        }

        // Variante con talle
        if (!item.size) {
          await Swal.fire({ icon: "error", title: "Falta talle", text: `El producto ${item.name} no tiene talle asignado.`, confirmButtonText: "Aceptar" });
          setIsCheckingOut(false);
          return;
        }

        let stockDisponible = 0;
        if (Array.isArray(producto.variantesPorColegio) && producto.variantesPorColegio.length) {
          if (!item.colegio) {
            await Swal.fire({ icon: "error", title: "Falta colegio", text: `El producto ${item.name} requiere colegio.`, confirmButtonText: "Aceptar" });
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
          await Swal.fire({ icon: "error", title: "Stock insuficiente", text: `${item.name} (${item.colegio ?? "sin colegio"} • ${item.size}) tiene solo ${stockDisponible} unidad(es).`, confirmButtonText: "Aceptar" });
          setIsCheckingOut(false);
          return;
        }
      }

      // Crear orden
      const fecha = new Date().toISOString();
      const ordenPayload = {
        data: {
          total,
          estado: "procesando",
          tipo_venta: "mostrador",
          fecha,
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
        await showDebugModal("Error creando orden", ordenPayload, ordenJson, { endpoint: "POST /api/fortela-ordenes" });
        throw new Error("Error al crear la orden");
      }

      const ordenId: number = ordenJson.data.id;
      const ordenDocId: string = ordenJson.data.documentId;

      // Crear items + actualizar stock
      for (const item of cart) {
        const producto = productosByDoc[item.documentId];
        const isBasicColor = !!(item.color || item.detalle);
        const isBasicPlain = !item.size && !item.variantes?.length && !item.variantesPorColegio?.length && !isBasicColor;

        let precioVariante = Number(item.price ?? 0);

        const itemPayload = {
          data: {
            cantidad: Number(item.quantity),
            ...(item.size ? { talle: String(item.size) } : {}),
            ...(item.colegio ? { colegio: String(item.colegio) } : {}),
            precio_unitario: Number(precioVariante),
            importe: Number(precioVariante) * Number(item.quantity),
            fortela_producto: { connect: [{ documentId: producto.documentId }] },
            fortela_orden: { connect: [{ documentId: ordenDocId }] },
          },
        };

        const itemRes = await fetch("https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(itemPayload),
        });
        const itemJson = await itemRes.json();
        if (!itemRes.ok) {
          console.error("🧾 Error ítem (payload):", JSON.stringify(itemPayload, null, 2));
          console.error("🧾 Error ítem (Strapi):", itemJson?.error || itemJson);
          await showDebugModal(`Error al crear ítem: ${item.name}`, itemPayload, itemJson, {
            endpoint: "POST /api/fortela-items-comprados",
            productoIdConectado: Number(producto.id),
            ordenIdConectado: Number(ordenId),
            itemDocumentId: item.documentId,
            itemColegio: item.colegio ?? null,
            itemTalle: item.size ?? null,
            itemCantidad: Number(item.quantity),
          });
          throw new Error(`Error al crear item de orden para ${item.name} → ${itemJson?.error?.message ?? "ver modal"}`);
        }

        // Actualizar stock
        if (isBasicPlain) {
          // Sin stock tracking (producto básico puro sin variantes)
          continue;
        }

        let dataPut: any = {};

        if (isBasicColor) {
          // Actualizar variantesBasico (match por color + detalle + talle)
          const nuevasVb = (producto.variantesBasico || []).map((v: any) => ({
            color: v.color,
            detalle: v.detalle,
            talle: v.talle,
            cantidad:
              (v.color ?? "") === (item.color ?? "") &&
              (v.detalle ?? "") === (item.detalle ?? "") &&
              (v.talle ?? "") === (item.size ?? "")
                ? Math.max(0, Number(v.cantidad ?? 0) - Number(item.quantity))
                : Number(v.cantidad ?? 0),
            precio: v.precio,
          }));
          const nuevoTotal = nuevasVb.reduce((s: number, v: any) => s + Number(v.cantidad ?? 0), 0);
          productosByDoc[item.documentId] = { ...producto, variantesBasico: nuevasVb, stock: nuevoTotal };
          dataPut = { variantesBasico: nuevasVb, stock: nuevoTotal };
        } else if (Array.isArray(producto.variantesPorColegio) && producto.variantesPorColegio.length) {
          const nuevasVpc = producto.variantesPorColegio.map((c: any) => ({
            colegio: c.colegio,
            variantesPorTalles: (c.variantesPorTalles || []).map((v: any) => ({
              talle: v.talle,
              cantidad: c.colegio === item.colegio && v.talle === item.size
                ? Math.max(0, Number(v.cantidad ?? 0) - Number(item.quantity))
                : Number(v.cantidad ?? 0),
              precio: v.precio,
            })),
          }));
          const nuevoTotal = nuevasVpc.flatMap((c: any) => c.variantesPorTalles).reduce((s: number, v: any) => s + Number(v.cantidad ?? 0), 0);
          productosByDoc[item.documentId] = { ...producto, variantesPorColegio: nuevasVpc, stock: nuevoTotal };
          dataPut = { variantesPorColegio: nuevasVpc, stock: nuevoTotal };
        } else {
          const nuevasVpt = (producto.variantesPorTalle || []).map((v: any) => ({
            talle: v.talle,
            cantidad: v.talle === item.size
              ? Math.max(0, Number(v.cantidad ?? 0) - Number(item.quantity))
              : Number(v.cantidad ?? 0),
            precio: v.precio,
          }));
          const nuevoTotal = nuevasVpt.reduce((s: number, v: any) => s + Number(v.cantidad ?? 0), 0);
          productosByDoc[item.documentId] = { ...producto, variantesPorTalle: nuevasVpt, stock: nuevoTotal };
          dataPut = { variantesPorTalle: nuevasVpt, stock: nuevoTotal };
        }

        const putRes = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${item.documentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: dataPut }),
        });
        const putJson = await putRes.json();
        if (!putRes.ok) {
          console.error("📉 Error PUT stock (request):", { data: dataPut });
          console.error("📉 Error PUT stock (response):", putJson);
          await showDebugModal(`Error al actualizar stock de ${item.name}`, { data: dataPut }, putJson, {
            endpoint: `PUT /api/productos/${item.documentId} (por documentId)`,
            colegio: item.colegio ?? null,
            talle: item.size ?? null,
            color: item.color ?? null,
            cantidadVendida: Number(item.quantity),
          });
          throw new Error(`Error al actualizar stock de ${item.name}`);
        }
      }

      // Guardar ticket
      const itemsForTicket = cart.map(i => ({
        descripcion: i.name,
        colegio: i.colegio ?? null,
        talle: i.size ?? null,
        color: i.color ?? i.detalle ?? null,
        cantidad: Number(i.quantity),
        precio: Number(i.price),
        importe: Number(i.price) * Number(i.quantity),
      }));

      if (typeof window !== "undefined") {
        sessionStorage.setItem("posTicketItems", JSON.stringify(itemsForTicket));
        sessionStorage.setItem("posTicketMeta", JSON.stringify({ ordenId: ordenDocId || String(ordenId), total }));
      }

      clearCart();
      await Swal.fire({ icon: "success", title: "¡Venta creada correctamente!", text: `Orden: ORD-${ordenId}`, timer: 1200, showConfirmButton: false });
      window.location.assign(`/pos/venta-completada?ordenId=${encodeURIComponent(ordenDocId)}&total=${encodeURIComponent(total)}`);
    } catch (error) {
      console.error("❌ Checkout error:", error);
      toast({ variant: "destructive", title: "Error al generar orden", description: "Ocurrió un error al finalizar la venta." });
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header sticky */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <h1 className="text-base font-semibold tracking-tight">Venta por mostrador</h1>
          {cart.length > 0 && (
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {cartCount} {cartCount === 1 ? "artículo" : "artículos"}
              </span>
              <span className="font-semibold text-sm tabular-nums">
                ${total.toLocaleString("es-AR")}
              </span>
              {hasPending && (
                <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 gap-1 hidden sm:flex">
                  <AlertCircle className="h-3 w-3" />
                  Talles pendientes
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Layout principal */}
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">

          {/* Izquierda: selector de productos */}
          <div className="flex flex-col gap-4">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
              <button
                onClick={() => setActiveTab("table")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === "table"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Table2 className="h-4 w-4" />
                Catálogo
              </button>
              <button
                onClick={() => { setActiveTab("scan"); setIsScanning(false); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === "scan"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Scan className="h-4 w-4" />
                Escanear QR
              </button>
            </div>

            {activeTab === "table" && (
              <ProductTableSelector
                productos={productos as any}
                onSelect={handleSelectFromTable}
              />
            )}

            {activeTab === "scan" && (
              <div className="rounded-xl border bg-card p-6">
                {isScanning ? (
                  <div className="space-y-4">
                    <QRScanner onScan={handleScan} />
                    <Button variant="outline" onClick={() => setIsScanning(false)} className="w-full">
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Scan className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium">Escaneá el código QR del producto</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Usá la cámara para agregar productos al carrito
                      </p>
                    </div>
                    <Button onClick={() => setIsScanning(true)} size="lg" className="mt-2 gap-2">
                      <Scan className="h-4 w-4" />
                      Iniciar escaneo
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Derecha: carrito */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border bg-card overflow-hidden sticky top-[72px]">
              {/* Cart header */}
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Carrito</span>
                  {cart.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {cart.length}
                    </Badge>
                  )}
                </div>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Vaciar
                  </Button>
                )}
              </div>

              {/* Cart items */}
              <div className="max-h-[50vh] xl:max-h-[calc(100vh-340px)] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 px-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center">
                      El carrito está vacío.<br />
                      Elegí un producto del catálogo.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 flex flex-col gap-2">
                    {cart.map((item, index) => (
                      <div
                        key={`${item.documentId}-${item.size ?? "x"}-${item.colegio ?? "x"}-${item.color ?? "x"}-${index}`}
                        className="flex flex-col gap-1"
                      >
                        <POSCartItem
                          item={item as any}
                          onIncrement={() => updateQuantity(item.id, item.size, 1, item.colegio, item.color)}
                          onDecrement={() => updateQuantity(item.id, item.size, -1, item.colegio, item.color)}
                          onRemove={() => removeItem(item.id, item.size, item.colegio, item.color)}
                          inlineSizeSelector={false}
                        />
                        {(item.variantes?.length || (item.variantesPorColegio?.length && item.colegio)) ? (
                          <button
                            onClick={() => openSizePicker(item)}
                            className="ml-2 text-xs text-primary hover:underline flex items-center gap-1 w-fit"
                          >
                            {item.pendingSize ? "Elegir talle" : "Cambiar talles"}
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart footer */}
              {cart.length > 0 && (
                <div className="border-t px-4 py-3 space-y-3">
                  {hasPending && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Hay productos con talle pendiente. Asignalo antes de confirmar.</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">${subtotal.toLocaleString("es-AR")}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold tabular-nums">${total.toLocaleString("es-AR")}</span>
                  </div>
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingOut || hasPending}
                  >
                    {isCheckingOut ? (
                      <>Procesando...</>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Confirmar venta
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Dialog: size picker desde carrito ─── */}
      <Dialog open={!!sizePickerItem} onOpenChange={(o) => !o && setSizePickerItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {sizePickerItem?.pendingSize ? "Elegir talle" : "Cambiar talles"} — {sizePickerItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-auto">
            {sizePickerItem?.variantes?.map((v) => {
              const actual = cartSizeSelections[v.talle] ?? 0;
              const max = v.cantidad ?? 0;
              return (
                <div key={v.talle} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="font-medium text-sm capitalize">Talle {v.talle}</span>
                    {typeof v.precio === "number" && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ${v.precio.toLocaleString("es-AR")}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">Stock: {max}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => decCartPicker(v.talle)} disabled={actual <= 0}>-</Button>
                    <input
                      type="number" inputMode="numeric"
                      className="w-12 text-center rounded-md border px-1 py-1 text-sm bg-background"
                      min={0} max={max} value={actual}
                      onChange={e => setCartPickerQty(v.talle, Number(e.target.value), max)}
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => incCartPicker(v.talle, max)} disabled={actual >= max}>+</Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button onClick={applyCartSizeSelections} className="w-full">Aplicar</Button>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: selección de talles + colegio ─── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {productoActual?.nombre}
            </DialogTitle>
          </DialogHeader>

          {/* Selector de colegio (múltiples) */}
          {productoActual?.variantesPorColegio?.length > 1 && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">Colegio</label>
              <div className="flex flex-wrap gap-2">
                {productoActual.variantesPorColegio.map((c: any) => (
                  <button
                    key={c.colegio}
                    onClick={() => onChangeColegioEnModal(c.colegio)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      selectedColegio === c.colegio
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {c.colegio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Label colegio único */}
          {productoActual?.variantesPorColegio?.length === 1 && (
            <p className="text-xs text-muted-foreground">
              Colegio: <span className="font-medium text-foreground">{productoActual.variantesPorColegio[0].colegio}</span>
            </p>
          )}

          {/* Talles */}
          <div className="flex flex-col gap-2 max-h-[50vh] overflow-auto">
            {variantes.map((v: any) => {
              const actual = selecciones[v.talle] ?? 0;
              const max = v.cantidad ?? 0;
              return (
                <div key={v.talle} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <span className="font-medium text-sm capitalize">Talle {v.talle}</span>
                    {typeof v.precio === "number" && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ${v.precio.toLocaleString("es-AR")}
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {max > 0 ? `${max} disponible${max !== 1 ? "s" : ""}` : "Sin stock"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => decTalle(v.talle)} disabled={actual <= 0 || max === 0}>-</Button>
                    <input
                      type="number" inputMode="numeric"
                      className="w-12 text-center rounded-md border px-1 py-1 text-sm bg-background"
                      min={0} max={max} value={actual}
                      onChange={e => setCantidadTalle(v.talle, Number(e.target.value), max)}
                      disabled={max === 0}
                    />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => incTalle(v.talle, max)} disabled={actual >= max || max === 0}>+</Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <Button onClick={confirmarSelecciones} disabled={totalSeleccionado === 0} className="w-full">
              {totalSeleccionado > 0 ? `Agregar ${totalSeleccionado} al carrito` : "Seleccioná un talle"}
            </Button>
            <Button variant="ghost" onClick={continuarSinTalle} className="w-full text-sm">
              Continuar sin talle (elegir luego)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog: color/detalle para producto básico ─── */}
      <Dialog open={showBasicoModal} onOpenChange={(o) => !o && setShowBasicoModal(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {productoBasicoActual?.nombre} — Elegir variante
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2 max-h-[60vh] overflow-auto">
            {(productoBasicoActual?.variantesBasico || []).map((v: VarianteBasico, idx: number) => {
              const base = v.color || v.detalle || String(idx);
              const key = v.talle ? `${base}__${v.talle}` : base;
              const actual = seleccionesBasico[key] ?? 0;
              const max = v.cantidad ?? 0;
              const isColor = !!v.color;
              const label = [v.color || v.detalle, v.talle].filter(Boolean).join(" / ") || "Variante";

              // Dot color mapping
              const colorDot: Record<string, string> = {
                azul: "bg-blue-500",
                rojo: "bg-red-500",
                verde: "bg-green-500",
                gris: "bg-gray-400",
              };
              const dotClass = isColor ? (colorDot[v.color!.toLowerCase()] ?? "bg-muted-foreground") : "";

              return (
                <div key={key} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    {isColor && <span className={`h-3 w-3 rounded-full shrink-0 ${dotClass}`} />}
                    <div>
                      <span className="font-medium text-sm capitalize">{label}</span>
                      {typeof v.precio === "number" && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ${v.precio.toLocaleString("es-AR")}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {max > 0 ? `${max} disponible${max !== 1 ? "s" : ""}` : "Sin stock"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="icon" className="h-8 w-8"
                      onClick={() => setSeleccionesBasico(prev => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) - 1) }))}
                      disabled={actual <= 0 || max === 0}
                    >-</Button>
                    <input
                      type="number" inputMode="numeric"
                      className="w-12 text-center rounded-md border px-1 py-1 text-sm bg-background"
                      min={0} max={max} value={actual}
                      disabled={max === 0}
                      onChange={e => setSeleccionesBasico(prev => ({ ...prev, [key]: Math.max(0, Math.min(max, Number(e.target.value))) }))}
                    />
                    <Button
                      variant="outline" size="icon" className="h-8 w-8"
                      onClick={() => setSeleccionesBasico(prev => ({ ...prev, [key]: Math.min(max, (prev[key] ?? 0) + 1) }))}
                      disabled={actual >= max || max === 0}
                    >+</Button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            onClick={confirmarBasico}
            disabled={Object.values(seleccionesBasico).every(v => v === 0)}
            className="w-full"
          >
            {Object.values(seleccionesBasico).reduce((a, b) => a + b, 0) > 0
              ? `Agregar ${Object.values(seleccionesBasico).reduce((a, b) => a + b, 0)} al carrito`
              : "Seleccioná una variante"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
