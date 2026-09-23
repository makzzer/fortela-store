"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Swal from "sweetalert2";
import { Trash2, Plus, Minus, School, X } from "lucide-react";
import MultiSelect, { Option } from "@/components/shared/MultiSelect";

// ─── Constantes ───────────────────────────────────────────────────────────────

const generosUI = [
  { label: "Niña", value: "niña" },
  { label: "Niño", value: "niño" },
  { label: "Unisex", value: "unisex" },
];

// Colegios reales (sin "Producto básico" como opción)
const COLEGIOS_OPTS: Option[] = [
  { label: "San marcelo", value: "San marcelo" },
  { label: "José Hernández", value: "José Hernández" },
  { label: "Arnold Gesell", value: "Arnold Gesell" },
  { label: "Alvarez Condarco", value: "Alvarez Condarco" },
  { label: "Babar", value: "Babar" },
  { label: "San Román", value: "San Román" },
  { label: "Marcelo Torcuato de Alvear", value: "Marcelo Torcuato de Alvear" },
  { label: "Don torcuato", value: "Don torcuato" },
  { label: "Estrada", value: "Estrada" },
  { label: "Jardín de Luján", value: "Jardín de Luján" },
  { label: "San Martin", value: "San Martin" },
  { label: "Club Hindú", value: "Club Hindú" },
  { label: "Sanitarios", value: "Sanitarios" },
  { label: "Media 3", value: "Media 3" },
];

const COLORES = ["azul", "rojo", "verde", "gris"] as const;

const COLOR_DOT: Record<string, string> = {
  azul: "bg-blue-500",
  rojo: "bg-red-500",
  verde: "bg-green-500",
  gris: "bg-gray-400",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface VarianteTalle {
  talle: string;
  cantidad: number;
  precio: number;
}
interface ColegioBlock {
  colegio: string;
  variantesPorTalles: VarianteTalle[];
}
interface VarianteBasico {
  color?: string;
  detalle?: string;
  talle?: string;
  cantidad: number;
  precio: number;
}

// Tipo de producto
type TipoProducto = "colegio" | "talle" | "basico";

// ─── Página ───────────────────────────────────────────────────────────────────

export default function AddProductPage() {
  const router = useRouter();

  // Campos base
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    genero: "",
    precio: 0,
    imagen: null as File | null,
  });

  // Tipo de producto seleccionado
  const [tipoProd, setTipoProd] = useState<TipoProducto>("colegio");

  // Variantes por colegio
  const [colegiosSel, setColegiosSel] = useState<string[]>([]);
  const [bloques, setBloques] = useState<ColegioBlock[]>([]);

  // Variantes legacy por talle (global)
  const [globalTalles, setGlobalTalles] = useState<VarianteTalle[]>([]);

  // Variantes básico (color/detalle)
  const [variantesBasico, setVariantesBasico] = useState<VarianteBasico[]>([]);
  const [nuevoColor, setNuevoColor] = useState<string>("");
  const [nuevoDetalle, setNuevoDetalle] = useState<string>("");
  const [nuevoTalleBasico, setNuevoTalleBasico] = useState<string>("");
  const [nuevaCantidadBasico, setNuevaCantidadBasico] = useState<number>(0);
  const [nuevoPrecioBasico, setNuevoPrecioBasico] = useState<number>(0);

  // Precio del producto básico puro (sin variantes)
  const [precioBasico, setPrecioBasico] = useState<number>(0);
  const [stockBasico, setStockBasico] = useState<number>(0);

  // Colegios para filtro en modo básico
  const [colegiosBasico, setColegiosBasico] = useState<string[]>([]);

  // Sincronía colegiosSel ↔ bloques
  useMemo(() => {
    setBloques((prev) => {
      const map = new Map(prev.map(b => [b.colegio, b]));
      for (const c of colegiosSel) {
        if (!map.has(c)) map.set(c, { colegio: c, variantesPorTalles: [] });
      }
      return colegiosSel.map(c => map.get(c)!);
    });
  }, [colegiosSel]);

  // ─── Helpers colegio/talle ──────────────────────────────────────────────────

  const addTalleTo = (colegio: string) => {
    setBloques(prev => prev.map(b =>
      b.colegio !== colegio ? b
        : { ...b, variantesPorTalles: [...b.variantesPorTalles, { talle: "", cantidad: 0, precio: 0 }] }
    ));
  };

  const updateTalleIn = (colegio: string, idx: number, field: keyof VarianteTalle, value: string | number) => {
    setBloques(prev => prev.map(b => {
      if (b.colegio !== colegio) return b;
      const arr = b.variantesPorTalles.slice();
      arr[idx] = { ...arr[idx], [field]: field === "talle" ? String(value).toUpperCase() : Number(value) || 0 };
      return { ...b, variantesPorTalles: arr };
    }));
  };

  const removeTalleFrom = (colegio: string, idx: number) => {
    setBloques(prev => prev.map(b => {
      if (b.colegio !== colegio) return b;
      const arr = b.variantesPorTalles.slice();
      arr.splice(idx, 1);
      return { ...b, variantesPorTalles: arr };
    }));
  };

  // ─── Helpers talle global ────────────────────────────────────────────────────

  const addGlobalTalle = () => setGlobalTalles(v => [...v, { talle: "", cantidad: 0, precio: 0 }]);

  const updateGlobalTalle = (idx: number, field: keyof VarianteTalle, value: string | number) => {
    setGlobalTalles(prev => {
      const arr = prev.slice();
      arr[idx] = { ...arr[idx], [field]: field === "talle" ? String(value).toUpperCase() : Number(value) || 0 };
      return arr;
    });
  };

  const removeGlobalTalle = (idx: number) => setGlobalTalles(prev => prev.filter((_, i) => i !== idx));

  // ─── Helpers variantesBasico ─────────────────────────────────────────────────

  const addVarianteBasico = () => {
    const colorVal = nuevoColor.trim();
    const detalleVal = nuevoDetalle.trim();
    const talleVal = nuevoTalleBasico.trim().toUpperCase();
    if (!colorVal && !detalleVal) return;
    const existe = variantesBasico.find(
      v =>
        (v.color ?? "") === colorVal &&
        (v.detalle ?? "") === detalleVal &&
        (v.talle ?? "") === talleVal
    );
    if (existe) return;
    setVariantesBasico(prev => [
      ...prev,
      {
        color: colorVal || undefined,
        detalle: detalleVal || undefined,
        talle: talleVal || undefined,
        cantidad: nuevaCantidadBasico,
        precio: nuevoPrecioBasico,
      },
    ]);
    setNuevoColor("");
    setNuevoDetalle("");
    setNuevoTalleBasico("");
    setNuevaCantidadBasico(0);
    setNuevoPrecioBasico(0);
  };

  const removeVarianteBasico = (idx: number) => {
    setVariantesBasico(prev => prev.filter((_, i) => i !== idx));
  };

  const updateVarianteBasico = (idx: number, field: "cantidad" | "precio", value: number) => {
    setVariantesBasico(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const totalStockBasico = variantesBasico.reduce((s, v) => s + (v.cantidad ?? 0), 0);

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      await Swal.fire({ icon: "warning", title: "Falta el nombre" });
      return;
    }
    if (!form.genero) {
      await Swal.fire({ icon: "warning", title: "Seleccioná el género" });
      return;
    }

    let payload: any = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim(),
      genero: form.genero || "unisex",
    };

    if (tipoProd === "colegio") {
      // ── Con colegios ──
      if (colegiosSel.length === 0) {
        await Swal.fire({ icon: "warning", title: "Elegí al menos un colegio" });
        return;
      }
      const bloquesOk = bloques.map(b => ({
        colegio: b.colegio,
        variantesPorTalles: (b.variantesPorTalles || [])
          .filter(v => v.talle.trim())
          .map(v => ({ talle: v.talle.trim().toUpperCase(), cantidad: v.cantidad || 0, precio: v.precio || 0 })),
      })).filter(b => b.variantesPorTalles.length > 0);

      if (bloquesOk.length === 0) {
        await Swal.fire({ icon: "warning", title: "Agregá al menos un talle en algún colegio" });
        return;
      }

      const allTalles = bloquesOk.flatMap(b => b.variantesPorTalles);
      const preciosValidos = allTalles.filter(v => v.precio > 0).map(v => v.precio);
      const minPrecio = preciosValidos.length ? Math.min(...preciosValidos) : 0;
      const totalStock = allTalles.reduce((acc, v) => acc + (v.cantidad || 0), 0);

      payload = {
        ...payload,
        precio: minPrecio,
        stock: totalStock,
        colegio: colegiosSel,
        variantesPorColegio: bloquesOk,
        variantesPorTalle: [],
        variantesBasico: [],
      };

    } else if (tipoProd === "talle") {
      // ── Talles globales sin colegio ──
      const variantes = globalTalles
        .filter(v => v.talle.trim())
        .map(v => ({ talle: v.talle.trim().toUpperCase(), cantidad: v.cantidad || 0, precio: v.precio || 0 }));

      if (variantes.length === 0) {
        await Swal.fire({ icon: "warning", title: "Agregá al menos un talle" });
        return;
      }

      const preciosValidos = variantes.filter(v => v.precio > 0).map(v => v.precio);
      const minPrecio = preciosValidos.length ? Math.min(...preciosValidos) : 0;
      const totalStock = variantes.reduce((acc, v) => acc + (v.cantidad || 0), 0);

      payload = {
        ...payload,
        precio: minPrecio,
        stock: totalStock,
        variantesPorColegio: [],
        variantesPorTalle: variantes,
        variantesBasico: [],
      };

    } else {
      // ── Producto básico ──
      if (variantesBasico.length > 0) {
        // Con variantes de color/detalle
        const preciosValidos = variantesBasico.filter(v => v.precio > 0).map(v => v.precio);
        const minPrecioVb = preciosValidos.length ? Math.min(...preciosValidos) : (form.precio || 0);

        payload = {
          ...payload,
          precio: minPrecioVb,
          stock: totalStockBasico,
          colegio: colegiosBasico,
          variantesPorColegio: [],
          variantesPorTalle: [],
          variantesBasico: variantesBasico.map(v => ({
            color: v.color || null,
            detalle: v.detalle || null,
            talle: v.talle || null,
            cantidad: v.cantidad || 0,
            precio: v.precio || 0,
          })),
        };
      } else {
        // Básico puro (sin ninguna variante)
        payload = {
          ...payload,
          precio: precioBasico || 0,
          stock: stockBasico || 0,
          colegio: colegiosBasico,
          variantesPorColegio: [],
          variantesPorTalle: [],
          variantesBasico: [],
        };
      }
    }

    try {
      const res = await fetch("https://vps-4937880-x.dattaweb.com/api/productos?populate=*", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("❌ Error en la respuesta:", data);
        await Swal.fire({ icon: "error", title: "Error", text: data?.error?.message || "No se pudo guardar" });
        return;
      }
      await Swal.fire({ icon: "success", title: "Producto creado", text: "Guardado correctamente" });
      router.push("/admin/products");
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error de red", text: "No se pudo guardar el producto" });
    }
  };

  // Precio hint para tipos con variantes
  const priceHint =
    tipoProd === "colegio"
      ? bloques.flatMap(b => b.variantesPorTalles).map(v => v.precio).filter(p => p > 0)
      : tipoProd === "talle"
      ? globalTalles.map(v => v.precio).filter(p => p > 0)
      : variantesBasico.map(v => v.precio).filter(p => p > 0);
  const minPrecio = priceHint.length ? Math.min(...priceHint) : 0;

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Agregar nuevo producto</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ─── Datos base ─── */}
        <div className="grid gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="genero">Género</Label>
          <select
            id="genero"
            className="border rounded px-3 py-2"
            value={form.genero}
            onChange={e => setForm({ ...form, genero: e.target.value })}
            required
          >
            <option value="">Seleccionar</option>
            {generosUI.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>

        {/* ─── Tipo de producto ─── */}
        <div className="grid gap-3">
          <Label>Tipo de producto</Label>
          <div className="flex flex-wrap gap-2">
            {[
              { val: "colegio" as TipoProducto, label: "Por colegio (con talles)" },
              { val: "talle" as TipoProducto, label: "Por talle (global)" },
              { val: "basico" as TipoProducto, label: "Producto básico" },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setTipoProd(opt.val)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  tipoProd === opt.val
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {tipoProd === "colegio" && "Producto que varía según el colegio. Cargás talles y precios por cada colegio."}
            {tipoProd === "talle" && "Producto con talles pero sin distinción de colegio."}
            {tipoProd === "basico" && "Producto sin talle ni colegio. Podés agregar variantes de color u otro detalle."}
          </p>
        </div>

        <Separator />

        {/* ─── Por colegio ─── */}
        {tipoProd === "colegio" && (
          <div className="space-y-5">
            <div className="grid gap-2">
              <Label>Colegios</Label>
              <MultiSelect
                options={COLEGIOS_OPTS}
                value={colegiosSel}
                onChange={setColegiosSel}
                placeholder="Elegí uno o más colegios…"
              />
            </div>

            {bloques.map(b => (
              <div key={b.colegio} className="rounded-xl border p-4 shadow-sm bg-white dark:bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <School className="w-4 h-4" />
                    {b.colegio}
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => addTalleTo(b.colegio)}>
                    <Plus className="w-4 h-4 mr-1" /> Agregar talle
                  </Button>
                </div>

                {b.variantesPorTalles.length === 0 && (
                  <p className="text-xs text-muted-foreground mb-2">Sin talles cargados aún.</p>
                )}

                <div className="space-y-2">
                  {b.variantesPorTalles.map((v, idx) => (
                    <div key={`${b.colegio}-${idx}`} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-3">
                        <Label className="text-xs">Talle</Label>
                        <Input value={v.talle} placeholder="S, M, 2…" onChange={e => updateTalleIn(b.colegio, idx, "talle", e.target.value)} />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Stock</Label>
                        <Input type="number" min={0} value={String(v.cantidad)} onChange={e => updateTalleIn(b.colegio, idx, "cantidad", Number(e.target.value))} />
                      </div>
                      <div className="col-span-4 relative">
                        <Label className="text-xs">Precio</Label>
                        <span className="absolute left-3 top-[34px] text-sm text-muted-foreground">$</span>
                        <Input type="number" min={0} className="pl-7" value={String(v.precio)} onChange={e => updateTalleIn(b.colegio, idx, "precio", Number(e.target.value))} />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTalleFrom(b.colegio, idx)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {minPrecio > 0 && (
              <p className="text-xs text-muted-foreground">Precio mínimo sugerido: ${minPrecio.toLocaleString("es-AR")}</p>
            )}
          </div>
        )}

        {/* ─── Por talle global ─── */}
        {tipoProd === "talle" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Variantes por talle (global)</Label>
              <Button type="button" size="sm" variant="outline" onClick={addGlobalTalle}>
                <Plus className="w-4 h-4 mr-1" /> Agregar talle
              </Button>
            </div>

            {globalTalles.length === 0 && (
              <p className="text-xs text-muted-foreground">Agregá talles para este producto.</p>
            )}

            {globalTalles.map((v, idx) => (
              <div key={`g-${idx}`} className="grid grid-cols-12 gap-3 items-end border rounded-lg p-3">
                <div className="col-span-3">
                  <Label className="text-xs">Talle</Label>
                  <Input value={v.talle} placeholder="S, M, 2…" onChange={e => updateGlobalTalle(idx, "talle", e.target.value)} />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Stock</Label>
                  <Input type="number" min={0} value={String(v.cantidad)} onChange={e => updateGlobalTalle(idx, "cantidad", Number(e.target.value))} />
                </div>
                <div className="col-span-4 relative">
                  <Label className="text-xs">Precio</Label>
                  <span className="absolute left-3 top-[34px] text-sm text-muted-foreground">$</span>
                  <Input type="number" min={0} className="pl-7" value={String(v.precio)} onChange={e => updateGlobalTalle(idx, "precio", Number(e.target.value))} />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeGlobalTalle(idx)}>
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {minPrecio > 0 && (
              <p className="text-xs text-muted-foreground">Precio mínimo sugerido: ${minPrecio.toLocaleString("es-AR")}</p>
            )}
          </div>
        )}

        {/* ─── Producto básico ─── */}
        {tipoProd === "basico" && (
          <div className="space-y-5">

            {/* Colegio para filtro */}
            <div className="grid gap-2">
              <Label>Colegio(s) <span className="text-muted-foreground font-normal">(opcional, para filtros)</span></Label>
              <MultiSelect
                options={COLEGIOS_OPTS}
                value={colegiosBasico}
                onChange={setColegiosBasico}
                placeholder="Elegí uno o más colegios…"
              />
              <p className="text-xs text-muted-foreground">
                No genera variantes por colegio. Solo sirve para filtrar este producto en el POS.
              </p>
            </div>

            {/* Variantes de color/detalle */}
            <div className="rounded-xl border p-4 flex flex-col gap-4">
              <div>
                <p className="font-medium text-sm">Variantes de color / detalle <span className="text-muted-foreground font-normal">(opcional)</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Si el producto tiene distintos colores u otras diferencias, aggregalas acá. El stock se trackea por variante.
                </p>
              </div>

              {/* Variantes cargadas */}
              {variantesBasico.map((v, idx) => {
                const label = v.color || v.detalle || "—";
                const isColor = !!v.color;
                const dotClass = isColor ? (COLOR_DOT[v.color!.toLowerCase()] ?? "bg-muted-foreground") : "";
                return (
                  <div key={idx} className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 w-24 shrink-0">
                      {isColor && <span className={`h-3 w-3 rounded-full shrink-0 ${dotClass}`} />}
                      <span className="text-sm font-medium capitalize">{label}</span>
                    </div>
                    {v.talle && (
                      <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono shrink-0">{v.talle}</span>
                    )}
                    <Label className="text-xs text-muted-foreground shrink-0">Cant.</Label>
                    <Input type="number" min={0} className="h-7 w-16 text-xs" value={v.cantidad}
                      onChange={e => updateVarianteBasico(idx, "cantidad", Number(e.target.value))} />
                    <Label className="text-xs text-muted-foreground shrink-0">$</Label>
                    <Input type="number" min={0} className="h-7 w-20 text-xs" value={v.precio || ""}
                      onChange={e => updateVarianteBasico(idx, "precio", Number(e.target.value))} />
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeVarianteBasico(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}

              {variantesBasico.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Stock total: <span className="font-medium text-foreground">{totalStockBasico}</span>
                  {minPrecio > 0 && <span className="ml-3">Precio mínimo: <span className="font-medium text-foreground">${minPrecio.toLocaleString("es-AR")}</span></span>}
                </p>
              )}

              <Separator />

              {/* Agregar variante */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium">Agregar variante</p>

                {/* Colores predefinidos */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Color:</p>
                  <div className="flex flex-wrap gap-2">
                    {COLORES.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setNuevoColor(c); setNuevoDetalle(""); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium capitalize transition-all ${
                          nuevoColor === c
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${COLOR_DOT[c]}`} />
                        {c}
                      </button>
                    ))}
                    {nuevoColor && (
                      <button type="button" onClick={() => setNuevoColor("")}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-lg border transition-colors">
                        <X className="h-3 w-3" /> Limpiar
                      </button>
                    )}
                  </div>
                </div>

                {/* Detalle libre */}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">O escribir detalle libre:</Label>
                  <Input
                    value={nuevoDetalle}
                    onChange={e => { setNuevoDetalle(e.target.value); setNuevoColor(""); }}
                    placeholder="Ej: Tela impermeable, Edición 2025…"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Talle <span className="text-muted-foreground">(opcional)</span></Label>
                    <Input
                      value={nuevoTalleBasico}
                      onChange={e => setNuevoTalleBasico(e.target.value)}
                      className="h-8 w-20 text-xs" placeholder="M, L, 2…"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Cantidad</Label>
                    <Input type="number" min={0} value={nuevaCantidadBasico || ""}
                      onChange={e => setNuevaCantidadBasico(Number(e.target.value))}
                      className="h-8 w-20 text-xs" placeholder="0" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Precio</Label>
                    <Input type="number" min={0} value={nuevoPrecioBasico || ""}
                      onChange={e => setNuevoPrecioBasico(Number(e.target.value))}
                      className="h-8 w-24 text-xs" placeholder="0" />
                  </div>
                  <Button
                    type="button"
                    onClick={addVarianteBasico}
                    variant="outline" size="sm" className="gap-1.5 h-8"
                    disabled={!nuevoColor && !nuevoDetalle.trim()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Imagen ─── */}
        <div className="grid gap-2">
          <Label htmlFor="imagen">Imagen (por ahora no se sube)</Label>
          <Input id="imagen" type="file" accept="image/*"
            onChange={e => setForm({ ...form, imagen: e.target.files?.[0] ?? null })} />
          {form.imagen && <p className="text-sm text-muted-foreground">Imagen seleccionada: {form.imagen.name}</p>}
        </div>

        <Button type="submit" className="w-full">Crear producto</Button>
      </form>
    </div>
  );
}
