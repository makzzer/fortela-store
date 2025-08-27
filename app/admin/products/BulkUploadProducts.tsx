"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";

type ExcelRow = {
  nombre?: string;
  descripcion?: string;
  genero?: string;               // "niña" | "niño" | "unisex"
  tipo_uniforme?: string;        // "formal" | "deportivo"
  nivel_educativo?: string;      // "jardin,primaria,secundaria"
  etiqueta?: string;             // códigos colegio: "SMA,JHE,AGE,..."
  productos_talle?: string;      // "3,4,5,6" o "S,M,L,XL"
  productos_precio?: string;     // "16000,18000,20000,22000"
  productos_cantidad?: string;   // "0,0,0,0" (opcional)
};

const API_URL = "https://vps-4937880-x.dattaweb.com/api/productos?populate=*";

function cap(s?: string) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function splitCSV(s?: string): string[] {
  if (!s) return [];
  return String(s).split(",").map(x => x.trim()).filter(Boolean);
}
function splitNumCSV(s?: string): number[] {
  return splitCSV(s).map(x => {
    const n = Number(x.replace(/\s+/g, ""));
    return Number.isFinite(n) ? n : 0;
  });
}

export default function BulkUploadProducts() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab);

      // Hoja Productos
      const wsProd = wb.Sheets["Productos"] ?? wb.Sheets[wb.SheetNames[0]];
      if (!wsProd) {
        await Swal.fire({ icon: "warning", title: "Hoja no encontrada", text: "No se encontró la hoja 'Productos'." });
        return;
      }
      const rows = XLSX.utils.sheet_to_json<ExcelRow>(wsProd, { defval: "" });
      if (rows.length === 0) {
        await Swal.fire({ icon: "info", title: "Excel vacío", text: "No hay filas para procesar." });
        return;
      }

      // Glosario (A: nombre, B: código)
      const wsGlo = wb.Sheets["Glosario"];
      const codeToName: Record<string, string> = {};
      if (wsGlo) {
        const glosario = XLSX.utils.sheet_to_json<any[]>(wsGlo, { header: 1 }) as any[];
        for (const row of glosario) {
          const nombre = (row?.[0] ?? "").toString().trim();
          const codigo = (row?.[1] ?? "").toString().trim();
          if (nombre && codigo) codeToName[codigo.toUpperCase()] = nombre;
        }
      }

      // Confirmación
      const conf = await Swal.fire({
        icon: "question",
        title: "¿Cargar productos?",
        html: `Se encontraron <b>${rows.length}</b> filas en la hoja <b>Productos</b>.`,
        showCancelButton: true,
        confirmButtonText: "Sí, cargar",
        cancelButtonText: "Cancelar",
      });
      if (!conf.isConfirmed) return;

      let ok = 0;
      let fail = 0;
      let skippedEmptyName = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Procesar todas las filas
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const fila = i + 2;

        if (!r?.nombre?.toString().trim()) {
          skippedEmptyName++;
          warnings.push(`Fila ${fila}: sin "nombre" (se omitió).`);
          continue;
        }

        const talles = splitCSV(r.productos_talle);
        const precios = splitNumCSV(r.productos_precio);
        const cantidades = splitNumCSV(r.productos_cantidad);

        if (talles.length === 0) {
          warnings.push(`Fila ${fila} (${r.nombre}): sin "productos_talle".`);
        }
        if (precios.length === 0) {
          warnings.push(`Fila ${fila} (${r.nombre}): sin "productos_precio". Precio base=0.`);
        }
        if (talles.length !== precios.length) {
          warnings.push(`Fila ${fila} (${r.nombre}): talles (${talles.length}) ≠ precios (${precios.length}). Se alineó.`);
        }

        const maxLen = Math.max(talles.length, precios.length, cantidades.length || 0);
        while (talles.length < maxLen) talles.push(talles[talles.length - 1] ?? "");
        while (precios.length < maxLen) precios.push(precios[precios.length - 1] ?? 0);
        while (cantidades.length < maxLen) cantidades.push(0);

        const variantesPorTalle: Array<{ talle: string; precio: number; cantidad: number }> = [];
        for (let j = 0; j < maxLen; j++) {
          const talle = String(talles[j] ?? "").trim();
          if (!talle) continue;
          variantesPorTalle.push({
            talle,
            precio: Number(precios[j] ?? 0),
            cantidad: Number(cantidades[j] ?? 0),
          });
        }

        const precio = variantesPorTalle.length
          ? Math.min(...variantesPorTalle.map(v => v.precio || 0))
          : 0;
        const stock = variantesPorTalle.reduce((acc, v) => acc + (Number.isFinite(v.cantidad) ? v.cantidad : 0), 0);

        const codes = splitCSV(r.etiqueta);
        const unknown = codes.filter(c => !codeToName[c.toUpperCase()]);
        if (unknown.length) warnings.push(`Fila ${fila} (${r.nombre}): códigos sin glosario: ${unknown.join(", ")}.`);
        const colegios = codes.map(c => codeToName[c.toUpperCase()]).filter(Boolean);

        const payload = {
          nombre: cap(r.nombre) || "(Sin nombre)",
          descripcion: r.descripcion || "",
          genero: (r.genero || "unisex").toString().trim().toLowerCase(),
          tipo_uniforme: r.tipo_uniforme || null,
          nivel_educativo: r.nivel_educativo ? splitCSV(r.nivel_educativo) : null,
          precio,
          stock,
          variantesPorTalle,
          colegio: colegios.length ? colegios : null,
        };

        try {
          const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: payload }),
          });
          const json = await res.json();

          if (!res.ok) {
            fail++;
            errors.push(`Fila ${fila} (${payload.nombre}): ${json?.error?.message ?? "Error creando producto"}`);
          } else {
            ok++;
          }
        } catch (err: any) {
          fail++;
          errors.push(`Fila ${fila} (${payload.nombre}): ${err?.message ?? "Fallo de red"}`);
        }
      }

      const expected = rows.filter(r => r?.nombre?.toString().trim()).length;
      const createdOrFailed = ok + fail;

      const html = [
        `<b>${ok}</b> creados correctamente.`,
        fail ? `<br/><b>${fail}</b> con error.` : "",
        skippedEmptyName ? `<br/><b>${skippedEmptyName}</b> omitidos por "nombre" vacío.` : "",
        expected !== createdOrFailed
          ? `<br/>Atención: esperados ${expected}, procesados ${createdOrFailed} (revisar advertencias).`
          : "",
        warnings.length
          ? `<details style="margin-top:8px;"><summary>Ver advertencias (${warnings.length})</summary><pre style="text-align:left;white-space:pre-wrap">${warnings.join("\n")}</pre></details>`
          : "",
        errors.length
          ? `<details style="margin-top:8px;"><summary>Ver errores</summary><pre style="text-align:left;white-space:pre-wrap">${errors.join("\n")}</pre></details>`
          : "",
      ].join("");

      await Swal.fire({ icon: fail ? "warning" : "success", title: "Carga finalizada", html });
    } catch (err: any) {
      console.error(err);
      await Swal.fire({
        icon: "error",
        title: "Error procesando Excel",
        text: err?.message || "Revisá consola",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
      // 🔄 refrescar listado
      try {
        router.refresh();          // App Router
      } catch {
        window.location.reload();  // Fallback por si el contexto no se reactualiza
      }
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />

      {/* Botón responsive: solo ícono en xs, texto desde sm */}
      <Button
        type="button"
        onClick={openPicker}
        disabled={busy}
        aria-label="Importar Excel"
        className="
          rounded-full bg-emerald-600 hover:bg-emerald-700 text-white
          p-2 sm:px-4 sm:py-2
          gap-0 sm:gap-2
          w-fit
        "
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-5 w-5" />
        )}
        <span className="hidden sm:inline">
          {busy ? "Importando…" : "Importar Excel"}
        </span>
      </Button>
    </>
  );
}
