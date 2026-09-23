"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, X, ChevronLeft } from "lucide-react";
import Swal from "sweetalert2";

const STRAPI_URL = "https://vps-4937880-x.dattaweb.com";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface VarianteTalle {
  talle: string;
  cantidad: number;
  precio?: number;
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
  precio?: number;
}

// Colores predefinidos
const COLORES = ["azul", "rojo", "verde", "gris"];

const COLOR_DOT: Record<string, string> = {
  azul: "bg-blue-500",
  rojo: "bg-red-500",
  verde: "bg-green-500",
  gris: "bg-gray-400",
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EditProductPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Campos básicos
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState<number>(0);
  const [descripcion, setDescripcion] = useState("");
  const [genero, setGenero] = useState("");
  const [nivel, setNivel] = useState("");
  const [stock, setStock] = useState<number>(0);

  // Variantes por colegio
  const [colegiosSeleccionados, setColegiosSeleccionados] = useState<string[]>([]);
  const [variantesPorColegio, setVariantesPorColegio] = useState<ColegioBlock[]>([]);
  const [nuevoColegio, setNuevoColegio] = useState("");

  // Variantes globales (legacy)
  const [variantes, setVariantes] = useState<VarianteTalle[]>([]);
  const [nuevoTalle, setNuevoTalle] = useState("");
  const [nuevaCantidad, setNuevaCantidad] = useState<number>(0);
  const [nuevoPrecio, setNuevoPrecio] = useState<number | "">("");

  // ← NUEVO: variantes básico (color/detalle)
  const [variantesBasico, setVariantesBasico] = useState<VarianteBasico[]>([]);
  const [nuevoColor, setNuevoColor] = useState<string>("");
  const [nuevoDetalle, setNuevoDetalle] = useState<string>("");
  const [nuevoTalleBasico, setNuevoTalleBasico] = useState<string>("");
  const [nuevaCantidadBasico, setNuevaCantidadBasico] = useState<number>(0);
  const [nuevoPrecioBasico, setNuevoPrecioBasico] = useState<number | "">("");

  // Detectar si es básico
  const isBasico =
    colegiosSeleccionados.length === 0 &&
    variantes.length === 0 &&
    variantesPorColegio.length === 0;

  // ─── Fetch product ─────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const res = await fetch(
          `${STRAPI_URL}/api/productos?filters[documentId][$eq]=${documentId}` +
          `&populate[variantesPorColegio][populate]=*` +
          `&populate[variantesPorTalle]=*` +
          `&populate[variantesBasico]=*`
        );
        const data = await res.json();
        const item = data?.data?.[0];
        if (!item) throw new Error("Producto no encontrado");

        const attrs = item.attributes ?? item;
        setNombre(attrs.nombre ?? "");
        setPrecio(attrs.precio ?? 0);
        setDescripcion(attrs.descripcion ?? "");
        setGenero(attrs.genero ?? "");
        setNivel(attrs.nivel ?? "");
        setStock(attrs.stock ?? 0);

        const vpc: ColegioBlock[] = Array.isArray(attrs.variantesPorColegio)
          ? attrs.variantesPorColegio
          : [];
        setVariantesPorColegio(vpc);
        setColegiosSeleccionados(vpc.map(c => c.colegio));

        const vpt: VarianteTalle[] = Array.isArray(attrs.variantesPorTalle)
          ? attrs.variantesPorTalle
          : [];
        setVariantes(vpt);

        const vb: VarianteBasico[] = Array.isArray(attrs.variantesBasico)
          ? attrs.variantesBasico
          : [];
        setVariantesBasico(vb);
      } catch (err) {
        console.error(err);
        await Swal.fire({ icon: "error", title: "Error", text: "No se pudo cargar el producto." });
      } finally {
        setLoading(false);
      }
    };
    fetchProducto();
  }, [documentId]);

  // ─── Variantes por colegio helpers ─────────────────────────────────────────

  const addColegio = () => {
    const trimmed = nuevoColegio.trim();
    if (!trimmed || colegiosSeleccionados.includes(trimmed)) return;
    setColegiosSeleccionados(prev => [...prev, trimmed]);
    setVariantesPorColegio(prev => [...prev, { colegio: trimmed, variantesPorTalles: [] }]);
    setNuevoColegio("");
  };

  const removeColegio = (colegio: string) => {
    setColegiosSeleccionados(prev => prev.filter(c => c !== colegio));
    setVariantesPorColegio(prev => prev.filter(c => c.colegio !== colegio));
  };

  const addTalleAColegio = (colegio: string, talle: string, cantidad: number, precio?: number) => {
    if (!talle.trim()) return;
    setVariantesPorColegio(prev =>
      prev.map(c => {
        if (c.colegio !== colegio) return c;
        const exists = c.variantesPorTalles.find(v => v.talle === talle.trim());
        if (exists) return c;
        return { ...c, variantesPorTalles: [...c.variantesPorTalles, { talle: talle.trim(), cantidad, precio: precio || undefined }] };
      })
    );
  };

  const removeTalleFromColegio = (colegio: string, talle: string) => {
    setVariantesPorColegio(prev =>
      prev.map(c => {
        if (c.colegio !== colegio) return c;
        return { ...c, variantesPorTalles: c.variantesPorTalles.filter(v => v.talle !== talle) };
      })
    );
  };

  const updateTalleColegio = (colegio: string, talle: string, field: "cantidad" | "precio", value: number) => {
    setVariantesPorColegio(prev =>
      prev.map(c => {
        if (c.colegio !== colegio) return c;
        return {
          ...c,
          variantesPorTalles: c.variantesPorTalles.map(v =>
            v.talle === talle ? { ...v, [field]: value } : v
          ),
        };
      })
    );
  };

  // ─── Variantes globales helpers ─────────────────────────────────────────────

  const addVariante = () => {
    if (!nuevoTalle.trim()) return;
    if (variantes.find(v => v.talle === nuevoTalle.trim())) return;
    setVariantes(prev => [
      ...prev,
      { talle: nuevoTalle.trim(), cantidad: nuevaCantidad, precio: nuevoPrecio !== "" ? Number(nuevoPrecio) : undefined },
    ]);
    setNuevoTalle("");
    setNuevaCantidad(0);
    setNuevoPrecio("");
  };

  const removeVariante = (talle: string) => {
    setVariantes(prev => prev.filter(v => v.talle !== talle));
  };

  const updateVariante = (talle: string, field: "cantidad" | "precio", value: number) => {
    setVariantes(prev => prev.map(v => v.talle === talle ? { ...v, [field]: value } : v));
  };

  // ─── Variantes básico helpers ───────────────────────────────────────────────

  const addVarianteBasico = () => {
    const colorVal = nuevoColor.trim();
    const detalleVal = nuevoDetalle.trim();
    const talleVal = nuevoTalleBasico.trim().toUpperCase();
    if (!colorVal && !detalleVal) return;

    // Evitar duplicado exacto (misma combinación color+detalle+talle)
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
        precio: nuevoPrecioBasico !== "" ? Number(nuevoPrecioBasico) : undefined,
      },
    ]);
    setNuevoColor("");
    setNuevoDetalle("");
    setNuevoTalleBasico("");
    setNuevaCantidadBasico(0);
    setNuevoPrecioBasico("");
  };

  const removeVarianteBasico = (idx: number) => {
    setVariantesBasico(prev => prev.filter((_, i) => i !== idx));
  };

  const updateVarianteBasico = (idx: number, field: "cantidad" | "precio", value: number) => {
    setVariantesBasico(prev =>
      prev.map((v, i) => i === idx ? { ...v, [field]: value } : v)
    );
  };

  // Stock total calculado
  const totalStockBasico = variantesBasico.reduce((s, v) => s + (v.cantidad ?? 0), 0);

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      await Swal.fire({ icon: "warning", title: "Nombre requerido", text: "Completá el nombre del producto." });
      return;
    }

    // Validación: si hay colegios seleccionados, deben tener talles
    if (colegiosSeleccionados.length > 0) {
      for (const col of variantesPorColegio) {
        if (col.variantesPorTalles.length === 0) {
          await Swal.fire({ icon: "warning", title: "Talles faltantes", text: `El colegio "${col.colegio}" no tiene talles agregados.` });
          return;
        }
      }
    }

    // Validación: si hay variantes legacy sin colegios, debe haber al menos 1
    if (!isBasico && variantes.length === 0 && colegiosSeleccionados.length === 0) {
      await Swal.fire({ icon: "warning", title: "Sin variantes", text: "Agregá al menos un talle o colegio, o dejá el producto como básico." });
      return;
    }

    // Calcular stock total
    let stockTotal = stock;
    if (colegiosSeleccionados.length > 0) {
      stockTotal = variantesPorColegio.flatMap(c => c.variantesPorTalles).reduce((s, v) => s + (v.cantidad ?? 0), 0);
    } else if (variantes.length > 0) {
      stockTotal = variantes.reduce((s, v) => s + (v.cantidad ?? 0), 0);
    } else if (variantesBasico.length > 0) {
      stockTotal = totalStockBasico;
    }

    setSaving(true);
    try {
      const payload: any = {
        nombre: nombre.trim(),
        precio: Number(precio),
        descripcion: descripcion.trim(),
        genero: genero.trim() || null,
        nivel: nivel.trim() || null,
        stock: stockTotal,
      };

      if (colegiosSeleccionados.length > 0) {
        payload.variantesPorColegio = variantesPorColegio;
        payload.variantesPorTalle = [];
        payload.variantesBasico = [];
      } else if (variantes.length > 0) {
        payload.variantesPorColegio = [];
        payload.variantesPorTalle = variantes;
        payload.variantesBasico = [];
      } else if (variantesBasico.length > 0) {
        payload.variantesPorColegio = [];
        payload.variantesPorTalle = [];
        payload.variantesBasico = variantesBasico;
      } else {
        // Básico puro sin nada
        payload.variantesPorColegio = [];
        payload.variantesPorTalle = [];
        payload.variantesBasico = [];
      }

      const res = await fetch(`${STRAPI_URL}/api/productos/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message ?? "Error desconocido");
      }

      await Swal.fire({ icon: "success", title: "Guardado", text: "El producto fue actualizado.", timer: 1200, showConfirmButton: false });
      router.push("/admin/products");
    } catch (err: any) {
      await Swal.fire({ icon: "error", title: "Error al guardar", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando producto...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/products")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a productos
      </button>

      <h1 className="text-xl font-semibold mb-6">Editar producto</h1>

      <div className="flex flex-col gap-6">

        {/* ─── Datos básicos ─── */}
        <section className="rounded-xl border p-5 flex flex-col gap-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Datos básicos</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Short liso" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="precio">Precio base ($)</Label>
              <Input id="precio" type="number" min={0} value={precio} onChange={e => setPrecio(Number(e.target.value))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="genero">Género</Label>
              <Input id="genero" value={genero} onChange={e => setGenero(e.target.value)} placeholder="Ej: Masculino" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nivel">Nivel</Label>
              <Input id="nivel" value={nivel} onChange={e => setNivel(e.target.value)} placeholder="Ej: Primaria" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Descripción del producto (opcional)"
              rows={3}
            />
          </div>
        </section>

        {/* ─── Variantes por colegio ─── */}
        <section className="rounded-xl border p-5 flex flex-col gap-4">
          <div>
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Variantes por colegio</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Para productos que varían según el colegio (talles por colegio).
            </p>
          </div>

          {/* Agregar colegio */}
          <div className="flex gap-2">
            <Input
              value={nuevoColegio}
              onChange={e => setNuevoColegio(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addColegio()}
              placeholder="Nombre del colegio..."
              className="flex-1"
            />
            <Button onClick={addColegio} variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>

          {/* Colegios */}
          {variantesPorColegio.map(block => (
            <div key={block.colegio} className="rounded-lg border p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{block.colegio}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeColegio(block.colegio)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Talles de este colegio */}
              {block.variantesPorTalles.map(v => (
                <div key={v.talle} className="flex items-center gap-3 pl-2">
                  <Badge variant="secondary" className="text-xs">{v.talle}</Badge>
                  <div className="flex items-center gap-1.5 flex-1">
                    <Label className="text-xs text-muted-foreground w-16 shrink-0">Cantidad</Label>
                    <Input
                      type="number" min={0} className="h-7 w-20 text-xs"
                      value={v.cantidad}
                      onChange={e => updateTalleColegio(block.colegio, v.talle, "cantidad", Number(e.target.value))}
                    />
                    <Label className="text-xs text-muted-foreground w-12 shrink-0">Precio</Label>
                    <Input
                      type="number" min={0} className="h-7 w-24 text-xs"
                      value={v.precio ?? ""}
                      placeholder="—"
                      onChange={e => updateTalleColegio(block.colegio, v.talle, "precio", Number(e.target.value))}
                    />
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeTalleFromColegio(block.colegio, v.talle)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {/* Agregar talle al colegio */}
              <TalleAdder onAdd={(talle, cantidad, precio) => addTalleAColegio(block.colegio, talle, cantidad, precio)} />
            </div>
          ))}
        </section>

        {/* ─── Variantes globales (sin colegio) ─── */}
        <section className="rounded-xl border p-5 flex flex-col gap-4">
          <div>
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Variantes globales (talles)</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Para productos con talles pero sin distinción de colegio.
            </p>
          </div>

          {variantes.map(v => (
            <div key={v.talle} className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs w-12 justify-center">{v.talle}</Badge>
              <Label className="text-xs text-muted-foreground shrink-0">Cant.</Label>
              <Input
                type="number" min={0} className="h-7 w-20 text-xs"
                value={v.cantidad}
                onChange={e => updateVariante(v.talle, "cantidad", Number(e.target.value))}
              />
              <Label className="text-xs text-muted-foreground shrink-0">Precio</Label>
              <Input
                type="number" min={0} className="h-7 w-24 text-xs"
                value={v.precio ?? ""}
                placeholder="—"
                onChange={e => updateVariante(v.talle, "precio", Number(e.target.value))}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeVariante(v.talle)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {/* Agregar talle global */}
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Talle</Label>
              <Input
                value={nuevoTalle}
                onChange={e => setNuevoTalle(e.target.value)}
                placeholder="Ej: S"
                className="h-8 w-20 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Cantidad</Label>
              <Input
                type="number" min={0} value={nuevaCantidad}
                onChange={e => setNuevaCantidad(Number(e.target.value))}
                className="h-8 w-20 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Precio (opcional)</Label>
              <Input
                type="number" min={0} value={nuevoPrecio}
                onChange={e => setNuevoPrecio(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="—"
                className="h-8 w-24 text-xs"
              />
            </div>
            <Button onClick={addVariante} variant="outline" size="sm" className="gap-1.5 h-8">
              <Plus className="h-3.5 w-3.5" />
              Agregar talle
            </Button>
          </div>
        </section>

        {/* ─── Variantes básico (color / detalle) ─── */}
        {isBasico && (
          <section className="rounded-xl border p-5 flex flex-col gap-4">
            <div>
              <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Variantes de color / detalle
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Para productos básicos con distintos colores u otras diferencias (sin talle ni colegio).
              </p>
            </div>

            {/* Variantes existentes */}
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
                  <Input
                    type="number" min={0} className="h-7 w-16 text-xs"
                    value={v.cantidad}
                    onChange={e => updateVarianteBasico(idx, "cantidad", Number(e.target.value))}
                  />
                  <Label className="text-xs text-muted-foreground shrink-0">$</Label>
                  <Input
                    type="number" min={0} className="h-7 w-20 text-xs"
                    value={v.precio ?? ""}
                    placeholder="—"
                    onChange={e => updateVarianteBasico(idx, "precio", Number(e.target.value))}
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeVarianteBasico(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}

            {variantesBasico.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Stock total calculado: <span className="font-medium text-foreground">{totalStockBasico}</span>
              </p>
            )}

            <Separator />

            {/* Agregar nueva variante */}
            <div className="flex flex-col gap-3">
              <Label className="text-xs font-medium">Agregar variante</Label>

              {/* Botones de colores predefinidos */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Seleccionar color:</p>
                <div className="flex flex-wrap gap-2">
                  {COLORES.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setNuevoColor(c); setNuevoDetalle(""); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium capitalize transition-all ${
                        nuevoColor === c
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 text-foreground"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${COLOR_DOT[c]}`} />
                      {c}
                    </button>
                  ))}
                  {nuevoColor && (
                    <button
                      type="button"
                      onClick={() => setNuevoColor("")}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-lg border transition-colors"
                    >
                      <X className="h-3 w-3" />
                      Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* O escribir detalle libre */}
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground">O escribir detalle libre:</Label>
                <Input
                  value={nuevoDetalle}
                  onChange={e => { setNuevoDetalle(e.target.value); setNuevoColor(""); }}
                  placeholder="Ej: Tela impermeable, Edición 2025..."
                  className="h-8 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-end">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Talle <span className="text-muted-foreground">(opcional)</span></Label>
                  <Input
                    value={nuevoTalleBasico}
                    onChange={e => setNuevoTalleBasico(e.target.value)}
                    placeholder="M, L, 2…"
                    className="h-8 w-20 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number" min={0} value={nuevaCantidadBasico}
                    onChange={e => setNuevaCantidadBasico(Number(e.target.value))}
                    className="h-8 w-20 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Precio (opcional)</Label>
                  <Input
                    type="number" min={0} value={nuevoPrecioBasico}
                    onChange={e => setNuevoPrecioBasico(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="—"
                    className="h-8 w-24 text-xs"
                  />
                </div>
                <Button
                  onClick={addVarianteBasico}
                  variant="outline" size="sm"
                  className="gap-1.5 h-8"
                  disabled={!nuevoColor && !nuevoDetalle.trim()}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Agregar variante
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ─── Guardar ─── */}
        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={saving} className="flex-1">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/admin/products")} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: TalleAdder ─────────────────────────────────────────────────

function TalleAdder({ onAdd }: { onAdd: (talle: string, cantidad: number, precio?: number) => void }) {
  const [talle, setTalle] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [precio, setPrecio] = useState<number | "">("");

  const add = () => {
    if (!talle.trim()) return;
    onAdd(talle.trim(), cantidad, precio !== "" ? Number(precio) : undefined);
    setTalle("");
    setCantidad(0);
    setPrecio("");
  };

  return (
    <div className="flex flex-wrap gap-2 items-end pl-2 pt-1">
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Talle</Label>
        <Input value={talle} onChange={e => setTalle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Ej: M" className="h-7 w-16 text-xs" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Cant.</Label>
        <Input type="number" min={0} value={cantidad} onChange={e => setCantidad(Number(e.target.value))} className="h-7 w-20 text-xs" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Precio</Label>
        <Input type="number" min={0} value={precio} onChange={e => setPrecio(e.target.value === "" ? "" : Number(e.target.value))} placeholder="—" className="h-7 w-24 text-xs" />
      </div>
      <Button onClick={add} variant="outline" size="sm" className="gap-1 h-7 text-xs">
        <Plus className="h-3 w-3" />
        Talle
      </Button>
    </div>
  );
}
