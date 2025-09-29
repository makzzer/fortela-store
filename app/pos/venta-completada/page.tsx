// app/pos/venta-completada/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function VentaCompletadaPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const ordenId = useMemo(() => Number(sp.get("ordenId")), [sp]);
  const total = useMemo(() => Number(sp.get("total") || 0), [sp]);
  const [loading, setLoading] = useState(false);

  const volverAlPOS = () => router.push("/pos");

  const imprimirTicket = async () => {
    if (!ordenId || Number.isNaN(ordenId)) {
      alert("Falta el ID de la orden");
      return;
    }

    // Abrimos la pestaña ANTES para evitar bloqueos de pop-up
    const newTab = window.open("", "_blank");
    setLoading(true);
    try {
      const res = await fetch("/api/ticket-cambio/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ordenNumericId: ordenId,
          numero: `ORD-${ordenId}`,
          fecha: new Date().toLocaleDateString("es-AR"),
          cliente: "Consumidor Final", // si tenés el cliente real, pasalo aquí
          total,                       // opcional; el server también lo calcula
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "No se pudo generar el PDF");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (newTab) newTab.location.href = url;
      else window.open(url, "_blank");

      // (opcional) limpieza del blob URL
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error(e);
      if (newTab) newTab.close();
      alert("Error al generar el ticket. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl border rounded-2xl shadow-sm p-6 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Venta creada</h1>
          <span className="text-sm text-gray-500">ORD-{ordenId}</span>
        </div>

        <p className="mt-2 text-gray-600">
          La venta se registró correctamente. ¿Qué querés hacer ahora?
        </p>

        <div className="mt-4 text-sm text-gray-500">
          <div>Total: <strong>${total?.toFixed?.(2) ?? total}</strong></div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={volverAlPOS}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 hover:bg-gray-50 transition"
          >
            Volver al POS
          </button>

          <button
            onClick={imprimirTicket}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg bg-black text-white px-4 py-2.5 hover:opacity-90 disabled:opacity-60 transition"
            title="Generar ticket de cambio (PDF)"
          >
            {loading ? "Generando…" : "Imprimir ticket de cambio"}
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Podés descargarlo o imprimirlo desde el visor del navegador.
        </div>
      </div>
    </div>
  );
}
