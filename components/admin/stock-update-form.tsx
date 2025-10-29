"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Swal from "sweetalert2"

interface StockUpdateFormProps {
  productId: string // documentId
  colegio: string
  talle: string
  productName:string;
}


interface Variante {
  talle: string
  cantidad: number
  precio?: number
}

export default function StockUpdateForm({ productId, colegio, talle,productName }: StockUpdateFormProps) {
  const [operation, setOperation] = useState<"add" | "remove">("add")
  const [quantity, setQuantity] = useState<number | "">("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [producto, setProducto] = useState<any>(null)
  const [internalId, setInternalId] = useState<number | null>(null)
  const [debugPayload, setDebugPayload] = useState<any>(null)
  const [putErrorMessage, setPutErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const res = await fetch(
          `https://vps-4937880-x.dattaweb.com/api/productos` +
          `?filters[documentId][$eq]=${encodeURIComponent(productId)}` +
          `&populate[variantesPorTalle]=*` +
          `&populate[variantesPorColegio][populate][variantesPorTalles]=*` +
          `&pagination[pageSize]=1`
        )

        const responseText = await res.text()
        let parsedJson: any = null
        try {
          parsedJson = JSON.parse(responseText)
        } catch (e) { }

        if (!res.ok) {
          throw new Error(
            `Error ${res.status} ${res.statusText}\n\n` +
            (parsedJson ? JSON.stringify(parsedJson, null, 2) : responseText)
          )
        }

        const data = parsedJson
        const productoData = data?.data?.[0]
        if (!productoData) throw new Error("Producto no encontrado")

        setProducto(productoData)
        setInternalId(productoData.id)
        setPutErrorMessage(null) // limpiamos errores anteriores
      } catch (err: any) {
        console.error("ERROR FETCH:", err)
        setPutErrorMessage(err.message)

        Swal.fire({
          title: "Error al cargar producto",
          icon: "error",
          html: `<pre style="text-align:left;overflow-x:auto;font-size:11px">${err.message}</pre>`,
          customClass: { popup: "text-left" },
          width: 600,
        })
      }
    }

    if (productId && talle) fetchProducto()
  }, [productId, talle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🚧 Validaciones básicas
    if (!producto) return;

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      await Swal.fire("Cantidad inválida", "Ingresá una cantidad mayor a 0.", "warning");
      return;
    }
    if (!colegio || !talle) {
      await Swal.fire("Faltan datos", "Elegí el colegio y el talle.", "warning");
      return;
    }

    // 1) Ubicar colegio y talle
    const colegios: any[] = Array.isArray(producto?.variantesPorColegio) ? producto.variantesPorColegio : [];
    const idxColegio = colegios.findIndex((c) => String(c?.colegio) === String(colegio));
    if (idxColegio === -1) {
      await Swal.fire("Error", `No encontré el colegio "${colegio}"`, "error");
      return;
    }
    const tallesColegio: any[] = Array.isArray(colegios[idxColegio]?.variantesPorTalles) ? colegios[idxColegio].variantesPorTalles : [];
    const idxTalle = tallesColegio.findIndex((v) => String(v?.talle) === String(talle));
    if (idxTalle === -1) {
      await Swal.fire("Error", `No encontré el talle "${talle}" en "${colegio}"`, "error");
      return;
    }

    const stockActual = Number(tallesColegio[idxTalle]?.cantidad ?? 0);
    if (operation === "remove" && qty > stockActual) {
      await Swal.fire("Cantidad inválida", `Solo hay ${stockActual} unidades en stock`, "warning");
      return;
    }

    // 2) Actualizar solo ese talle del colegio elegido
    const nuevaCantidad = operation === "add" ? stockActual + qty : Math.max(0, stockActual - qty);

    const nuevasVariantesColegio = tallesColegio.map((v: any, i: number) => ({
      ...v,
      cantidad: i === idxTalle ? nuevaCantidad : Number(v?.cantidad ?? 0),
    }));

    const nuevosColegios = colegios.map((c: any, i: number) =>
      i === idxColegio ? { ...c, variantesPorTalles: nuevasVariantesColegio } : c
    );

    // 3) Reconstruir raíz (variantesPorTalle) + stock total
    const acc = new Map<string, { talle: string; cantidad: number; precio?: number }>();
    for (const c of nuevosColegios) {
      const arr = Array.isArray(c?.variantesPorTalles) ? c.variantesPorTalles : [];
      for (const v of arr) {
        if (!v || v.talle == null) continue;
        const key = String(v.talle);
        const cant = Number(v.cantidad ?? 0);
        const prev = acc.get(key);
        acc.set(key, {
          talle: key,
          cantidad: (prev?.cantidad ?? 0) + cant,
          precio: prev?.precio ?? v?.precio,
        });
      }
    }
    const nuevasVariantesRoot = Array.from(acc.values());
    const stockTotal = nuevasVariantesRoot.reduce((s, v) => s + Number(v.cantidad ?? 0), 0);
    const preciosValidos = nuevasVariantesRoot
      .map((v) => v.precio)
      .filter((p): p is number => typeof p === "number" && !Number.isNaN(p));

    // 4) Payload sin ids anidados
    const stripIds = (input: any) =>
      JSON.parse(JSON.stringify(input, (key, value) => (key === "id" ? undefined : value)));

    const payload = stripIds({
      data: {
        variantesPorColegio: nuevosColegios,
        variantesPorTalle: nuevasVariantesRoot.map((v) => ({
          talle: v.talle,
          cantidad: v.cantidad,
          precio: v.precio,
        })),
        stock: stockTotal,
        ...(preciosValidos.length ? { precio: Math.min(...preciosValidos) } : {}),
      },
    });

    setDebugPayload?.(payload);
    setIsSubmitting(true);

    try {
      // 5) Resolver ID numérico confiable ANTES del PUT
      let idParaPut = internalId;
      if (!Number.isFinite(idParaPut as any)) {
        // fallback: buscar por documentId y tomar el id
        const urlCheck =
          `https://vps-4937880-x.dattaweb.com/api/productos` +
          `?filters[documentId][$eq]=${encodeURIComponent(productId)}` +
          `&fields[0]=id&pagination[pageSize]=1`;
        const r = await fetch(urlCheck);
        const j = await r.json();
        idParaPut = j?.data?.[0]?.id ?? null;
      }

      if (!Number.isFinite(idParaPut as any)) {
        throw new Error(`No pude determinar el ID interno de Strapi para documentId=${productId}`);
      }

      const putUrl = `https://vps-4937880-x.dattaweb.com/api/productos/${idParaPut}`;
      console.log("🔗 PUT URL:", putUrl);
      console.log("📤 PUT payload:", payload);

      const putRes = await fetch(
        `https://vps-4937880-x.dattaweb.com/api/productos/${encodeURIComponent(productId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );



      const responseText = await putRes.text();
      console.log("📥 PUT response:", putRes.status, responseText);

      if (!putRes.ok) {
        setPutErrorMessage?.(`PUT falló - status ${putRes.status}\n\n${responseText}`);
        throw new Error(`PUT falló - status ${putRes.status}\n\n${responseText}`);
      }

      // 6) Refrescar estado local
      setProducto((prev: any) => ({
        ...prev,
        variantesPorColegio: nuevosColegios,
        variantesPorTalle: nuevasVariantesRoot,
        stock: stockTotal,
        precio: preciosValidos.length ? Math.min(...preciosValidos) : prev?.precio,
      }));

      setPutErrorMessage?.(null);
      // @ts-ignore
      setQuantity?.("");

      await Swal.fire(
        "Actualizado",
        `Nuevo stock para ${productName} ${colegio} - talle ${talle}: ${nuevaCantidad}`,
        "success"
      );
    } catch (err: any) {
      console.error("PUT ERROR:", err);
      setPutErrorMessage?.(String(err?.message || err));
      await Swal.fire({
        title: "Error al actualizar stock",
        icon: "error",
        html: `<pre style="text-align:left;white-space:pre-wrap">${String(err?.message || err)}</pre>`,
        customClass: { popup: "text-left" },
        width: 700,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!producto) return <p className="text-sm text-muted-foreground">Cargando producto...</p>

  // 1) intentar en el colegio seleccionado
  const varianteColegio: any =
    (producto?.variantesPorColegio || [])
      .find((c: any) => String(c?.colegio) === String(colegio))
      ?.variantesPorTalles
      ?.find((v: any) => String(v?.talle) === String(talle));

  // 2) fallback: intentar en la raíz (por compatibilidad con productos antiguos)
  const varianteRoot: Variante | undefined =
    Array.isArray(producto?.variantesPorTalle)
      ? (producto.variantesPorTalle as Variante[]).find((v) => String(v.talle) === String(talle))
      : undefined;

  const variante: any = varianteColegio ?? varianteRoot;

  if (!variante) {
    return <p className="text-sm text-red-500">Talle no encontrado en “{colegio}”.</p>;
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-sm">
        <p><strong>Colegio:</strong> {colegio}</p>
        <p><strong>Producto:</strong> {producto.nombre}</p>
        <p><strong>Talle:</strong> {talle}</p>
        <p><strong>Stock actual:</strong> {variante.cantidad}</p>
      </div>

      <div className="bg-muted p-3 rounded-md text-sm">
        <p className="font-medium mb-2">Stock por talle:</p>
        <ul className="list-disc ml-4 space-y-1">
          {Array.isArray(producto?.variantesPorColegio)
            ? (producto.variantesPorColegio.find((c: any) => c.colegio === colegio)?.variantesPorTalles || []).map((v: any) => (
              <li key={`${colegio}-${v.talle}`} className={v.talle === talle ? "font-semibold text-primary" : ""}>
                {v.talle}: {v.cantidad} unidades
              </li>
            ))
            : (producto.variantesPorTalle || []).map((v: any) => (
              <li key={v.talle}>
                {v.talle}: {v.cantidad} unidades
              </li>
            ))
          }
        </ul>

      </div>

      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <Button
            type="button"
            variant={operation === "add" ? "default" : "outline"}
            onClick={() => setOperation("add")}
            className="flex-1"
          >
            + Sumar stock
          </Button>

          <div className="text-muted-foreground text-sm w-32 text-center">
            {quantity !== "" && (
              <>
                {operation === "add" ? "Agregar" : "Quitar"}{" "}
                <strong>{quantity}</strong> unidad{quantity !== 1 ? "es" : ""}
              </>
            )}
          </div>

          <Button
            type="button"
            variant={operation === "remove" ? "default" : "outline"}
            onClick={() => setOperation("remove")}
            className="flex-1"
          >
            – Restar stock
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) =>
              setQuantity(e.target.value === "" ? "" : parseInt(e.target.value))
            }
          />
        </div>
      </div>



      {putErrorMessage && (
        <div className="bg-red-100 border border-red-300 text-red-800 p-3 text-xs rounded-md whitespace-pre-wrap overflow-auto">
          <strong>Detalle del error al guardar:</strong>
          <pre>{putErrorMessage}</pre>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || quantity === ""}>
        {isSubmitting ? "Actualizando..." : "Actualizar stock"}
      </Button>
    </form>
  )
}
