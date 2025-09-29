// app/pos/venta-completada/Client.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function VentaCompletadaClient() {
  const sp = useSearchParams();
  const router = useRouter();

  // ⚠️ ordenId ahora es string (documentId). No lo conviertas a número.
  const ordenId = useMemo(() => sp.get("ordenId") ?? "", [sp]);
  const totalFromQuery = useMemo(() => Number(sp.get("total") || 0), [sp]);

  const [loading, setLoading] = useState(false);

  const volverAlPOS = () => router.push("/pos");

  async function imprimirTicket() {
    try {
      setLoading(true);

      // 1) Leemos lo que guardó el POS antes de redirigir
      const meta = JSON.parse(sessionStorage.getItem("posTicketMeta") || "{}");
      const items = JSON.parse(sessionStorage.getItem("posTicketItems") || "[]");

      // 2) armamos el payload:
      //    - si tenemos items en memoria => los mandamos y NO pasamos ordenId (evita carrera con Strapi)
      //    - si no hay items => mandamos ordenId para que el route los busque
      const ordenIdForRoute: string | undefined = meta?.ordenId || ordenId || undefined;
      const total = Number(meta?.total ?? totalFromQuery) || 0;

      const payload: any = {
        numero: ordenIdForRoute ? `ORD-${ordenIdForRoute}` : undefined,
        total,
      };

      if (Array.isArray(items) && items.length > 0) {
        payload.items = items;                // ⬅ prioridad: lo que vendiste recién
      } else if (ordenIdForRoute) {
        payload.ordenId = ordenIdForRoute;    // ⬅ fallback: que el backend busque en Strapi
      } else {
        alert("No se encontraron datos para el ticket.");
        setLoading(false);
        return;
      }

      // 3) usamos el route que ya te funciona
      const res = await fetch("/api/ticket-cambio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "No se pudo generar el ticket");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      console.error(e);
      alert("No se pudo generar el ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl border rounded-2xl shadow-sm p-6 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Venta creada</h1>
          {/* ordenId es string: lo mostramos tal cual */}
          <span className="text-sm text-gray-500">{ordenId ? `ORD-${ordenId}` : "ORD"}</span>
        </div>

        <p className="mt-2 text-gray-600">
          La venta se registró correctamente. ¿Qué querés hacer ahora?
        </p>

        <div className="mt-4 text-sm text-gray-500">
          <div>
            Total: <strong>${Number.isFinite(totalFromQuery) ? totalFromQuery.toFixed(2) : totalFromQuery}</strong>
          </div>
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
