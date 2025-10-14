"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Swal from "sweetalert2";
import { Trash2, Plus, Minus, School } from "lucide-react";
import MultiSelect, { Option } from "@/components/shared/MultiSelect";

const generosUI = [
  { label: "Niña", value: "niña" },
  { label: "Niño", value: "niño" },
  { label: "Unisex", value: "unisex" },
];

// mismo catálogo que usaste en “crear”
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
  { label: "Producto básico", value: "Producto básico" },
];

interface VarianteTalle {
  talle: string;
  cantidad: number;
  precio: number;
}
interface ColegioBlock {
  colegio: string;
  variantesPorTalles: VarianteTalle[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const documentId = Array.isArray(params?.documentId) ? params.documentId[0] : (params?.documentId as string);

  const [cargando, setCargando] = useState(true);
  const [resultado, setResultado] = useState<string | null>(null);

  // base
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    genero: "",
    imagen: null as File | null,
  });

  // selección / bloques (nuevo)
  const [colegiosSel, setColegiosSel] = useState<string[]>([]);
  const [bloques, setBloques] = useState<ColegioBlock[]>([]);

  // talles globales (legacy)
  const [globalTalles, setGlobalTalles] = useState<VarianteTalle[]>([]);

  // ---------- FETCH ----------
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos/${documentId}?populate[variantesPorColegio][populate]=*`
        );
        const { data } = await res.json();
        const p = data;

        setForm({
          nombre: p?.nombre || "",
          descripcion: p?.descripcion || "",
          genero: p?.genero || "",
          imagen: null,
        });

        // si tiene colegios → usamos nuevo esquema
        const vpc = Array.isArray(p?.variantesPorColegio) ? p.variantesPorColegio : [];
        if (vpc.length > 0) {
          const blocks: ColegioBlock[] = vpc.map((c: any) => ({
            colegio: c?.colegio ?? "",
            variantesPorTalles: (Array.isArray(c?.variantesPorTalles) ? c.variantesPorTalles : []).map((v: any) => ({
              talle: v?.talle ?? "",
              cantidad: Number(v?.cantidad ?? 0),
              precio: Number(v?.precio ?? 0),
            })),
          }));
          setBloques(blocks);
          setColegiosSel(blocks.map((b) => b.colegio).filter(Boolean));
          setGlobalTalles([]); // no legacy
        } else {
          // legacy: sin colegios
          const legacy = Array.isArray(p?.variantesPorTalle) ? p.variantesPorTalle : [];
          setGlobalTalles(
            legacy.map((v: any) => ({
              talle: v?.talle ?? "",
              cantidad: Number(v?.cantidad ?? 0),
              precio: Number(v?.precio ?? 0),
            }))
          );
          setBloques([]);
          setColegiosSel([]);
        }
      } catch (e) {
        console.error("Error cargando producto:", e);
        setResultado("No se pudo cargar el producto");
      } finally {
        setCargando(false);
      }
    };
    if (documentId) fetchProduct();
  }, [documentId]);

  // ---------- SYNC selección <-> bloques ----------
  useEffect(() => {
    setBloques((prev) => {
      const map = new Map(prev.map((b) => [b.colegio, b]));
      // agregar nuevos
      for (const c of colegiosSel) if (!map.has(c)) map.set(c, { colegio: c, variantesPorTalles: [] });
      // mantener orden según selección
      return colegiosSel.map((c) => map.get(c)!).filter(Boolean);
    });
  }, [colegiosSel]);

  // ---------- UI HELPERS (nuevo) ----------
  const addTalleTo = (colegio: string) =>
    setBloques((prev) =>
      prev.map((b) =>
        b.colegio !== colegio ? b : { ...b, variantesPorTalles: [...b.variantesPorTalles, { talle: "", cantidad: 0, precio: 0 }] }
      )
    );

  const updateTalleIn = (colegio: string, idx: number, field: keyof VarianteTalle, value: string | number) =>
    setBloques((prev) =>
      prev.map((b) => {
        if (b.colegio !== colegio) return b;
        const arr = b.variantesPorTalles.slice();
        arr[idx] = {
          ...arr[idx],
          [field]: field === "talle" ? String(value).toUpperCase() : Number(value) || 0,
        };
        return { ...b, variantesPorTalles: arr };
      })
    );

  const removeTalleFrom = (colegio: string, idx: number) =>
    setBloques((prev) =>
      prev.map((b) => (b.colegio !== colegio ? b : { ...b, variantesPorTalles: b.variantesPorTalles.filter((_, i) => i !== idx) }))
    );

  // legacy UI helpers
  const addGlobalTalle = () => setGlobalTalles((v) => [...v, { talle: "", cantidad: 0, precio: 0 }]);
  const updateGlobalTalle = (idx: number, field: keyof VarianteTalle, value: string | number) =>
    setGlobalTalles((prev) => {
      const arr = prev.slice();
      arr[idx] = { ...arr[idx], [field]: field === "talle" ? String(value).toUpperCase() : Number(value) || 0 };
      return arr;
    });
  const removeGlobalTalle = (idx: number) => setGlobalTalles((prev) => prev.filter((_, i) => i !== idx));

  // ---------- SUBMIT ----------
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

    if (colegiosSel.length > 0) {
      const bloquesOk = bloques
        .map((b) => ({
          colegio: b.colegio,
          variantesPorTalles: (b.variantesPorTalles || [])
            .filter((v) => v.talle.trim())
            .map((v) => ({
              talle: v.talle.trim().toUpperCase(),
              cantidad: v.cantidad || 0,
              precio: v.precio || 0,
            })),
        }))
        .filter((b) => b.variantesPorTalles.length > 0);

      if (bloquesOk.length === 0) {
        await Swal.fire({ icon: "warning", title: "Agregá al menos un talle en algún colegio" });
        return;
      }

      const allTalles = bloquesOk.flatMap((b) => b.variantesPorTalles);
      const preciosValidos = allTalles.filter((v) => v.precio > 0).map((v) => v.precio);
      const minPrecio = preciosValidos.length ? Math.min(...preciosValidos) : 0;
      const totalStock = allTalles.reduce((acc, v) => acc + (v.cantidad || 0), 0);

      payload = {
        ...payload,
        precio: minPrecio,
        stock: totalStock,
        colegio: colegiosSel, // legacy tags
        variantesPorColegio: bloquesOk,
      };
    } else {
      const variantes = globalTalles
        .filter((v) => v.talle.trim())
        .map((v) => ({
          talle: v.talle.trim().toUpperCase(),
          cantidad: v.cantidad || 0,
          precio: v.precio || 0,
        }));

      if (variantes.length === 0) {
        await Swal.fire({ icon: "warning", title: "Agregá al menos un talle" });
        return;
      }

      const preciosValidos = variantes.filter((v) => v.precio > 0).map((v) => v.precio);
      const minPrecio = preciosValidos.length ? Math.min(...preciosValidos) : 0;
      const totalStock = variantes.reduce((acc, v) => acc + (v.cantidad || 0), 0);

      payload = {
        ...payload,
        precio: minPrecio,
        stock: totalStock,
        variantesPorTalle: variantes, // legacy
      };
    }

    try {
      const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos/${documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Error:", data);
        await Swal.fire({ icon: "error", title: "Error", text: data?.error?.message || "No se pudo actualizar" });
        return;
      }

      await Swal.fire({ icon: "success", title: "Producto actualizado" });
      router.push("/admin/products");
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "Error de red", text: "No se pudo actualizar el producto" });
    }
  };

  if (cargando) return <p className="p-6">Cargando…</p>;

  // precio sugerido (info)
  const priceHint =
    colegiosSel.length > 0
      ? bloques.flatMap((b) => b.variantesPorTalles).map((v) => v.precio).filter((p) => p > 0)
      : globalTalles.map((v) => v.precio).filter((p) => p > 0);
  const minPrecio = priceHint.length ? Math.min(...priceHint) : 0;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Editar producto</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Base */}
        <div className="grid gap-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Textarea id="descripcion" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="genero">Género</Label>
          <select
            id="genero"
            className="border rounded px-3 py-2"
            value={form.genero}
            onChange={(e) => setForm({ ...form, genero: e.target.value })}
            required
          >
            <option value="">Seleccionar</option>
            {generosUI.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        {/* Colegios */}
        <div className="grid gap-2">
          <Label>Colegios</Label>
          <MultiSelect
            options={COLEGIOS_OPTS}
            value={colegiosSel}
            onChange={setColegiosSel}
            placeholder="Elegí uno o más colegios…"
          />
          <p className="text-xs text-muted-foreground">
            Si seleccionás colegios, se editan talles por colegio. Si no hay colegios seleccionados, editás talles globales.
          </p>
        </div>

        {/* Bloques por colegio */}
        {colegiosSel.length > 0 ? (
          <div className="space-y-5">
            {bloques.map((b) => (
              <div key={b.colegio} className="rounded-xl border p-4 shadow-sm bg-white">
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
                  <div className="text-xs text-muted-foreground mb-2">Sin talles. Agregá talles para este colegio.</div>
                )}

                <div className="space-y-2">
                  {b.variantesPorTalles.map((v, idx) => (
                    <div key={`${b.colegio}-${idx}`} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-3">
                        <Label className="text-xs">Talle</Label>
                        <Input
                          value={v.talle}
                          placeholder="Ej: S, M, 2, 4"
                          onChange={(e) => updateTalleIn(b.colegio, idx, "talle", e.target.value)}
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Stock</Label>
                        <Input
                          type="number"
                          min={0}
                          value={String(v.cantidad)}
                          onChange={(e) => updateTalleIn(b.colegio, idx, "cantidad", Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-4 relative">
                        <Label className="text-xs">Precio</Label>
                        <span className="absolute left-3 top-[34px] text-sm text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min={0}
                          className="pl-7"
                          value={String(v.precio)}
                          onChange={(e) => updateTalleIn(b.colegio, idx, "precio", Number(e.target.value))}
                        />
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
            <div className="text-xs text-muted-foreground">
              Precio mínimo sugerido (a nivel producto): {minPrecio > 0 ? `$${minPrecio.toLocaleString("es-AR")}` : "-"}
            </div>
          </div>
        ) : (
          // LEGACY: talles globales
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Variantes por talle (global)</Label>
              <Button type="button" size="sm" variant="outline" onClick={addGlobalTalle}>
                <Plus className="w-4 h-4 mr-1" /> Agregar talle
              </Button>
            </div>

            {globalTalles.length === 0 && (
              <div className="text-xs text-muted-foreground">Agregá talles para este producto.</div>
            )}

            {globalTalles.map((v, idx) => (
              <div key={`g-${idx}`} className="grid grid-cols-12 gap-3 items-end border rounded-lg p-3">
                <div className="col-span-3">
                  <Label className="text-xs">Talle</Label>
                  <Input
                    value={v.talle}
                    placeholder="Ej: S, M, 2, 4"
                    onChange={(e) => updateGlobalTalle(idx, "talle", e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Stock</Label>
                  <Input
                    type="number"
                    min={0}
                    value={String(v.cantidad)}
                    onChange={(e) => updateGlobalTalle(idx, "cantidad", Number(e.target.value))}
                  />
                </div>
                <div className="col-span-4 relative">
                  <Label className="text-xs">Precio</Label>
                  <span className="absolute left-3 top-[34px] text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    min={0}
                    className="pl-7"
                    value={String(v.precio)}
                    onChange={(e) => updateGlobalTalle(idx, "precio", Number(e.target.value))}
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeGlobalTalle(idx)}>
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="text-xs text-muted-foreground">
              Precio mínimo sugerido (a nivel producto): {minPrecio > 0 ? `$${minPrecio.toLocaleString("es-AR")}` : "-"}
            </div>
          </div>
        )}

        {/* Imagen (placeholder) */}
        <div className="grid gap-2">
          <Label htmlFor="imagen">Imagen (por ahora no se sube)</Label>
          <Input id="imagen" type="file" accept="image/*" onChange={(e) => setForm({ ...form, imagen: e.target.files?.[0] ?? null })} />
          {form.imagen && <p className="text-sm text-muted-foreground">Imagen seleccionada: {form.imagen.name}</p>}
        </div>

        <Button type="submit" className="w-full">Guardar cambios</Button>
        <div className="flex gap-4">
          <Button type="button" variant="outline" className="w-full bg-gray-300/40" onClick={() => router.push("/admin/products")}>
            Cancelar
          </Button>
        </div>
      </form>

      {resultado && <p className="text-sm text-muted-foreground">{resultado}</p>}
    </div>
  );
}
