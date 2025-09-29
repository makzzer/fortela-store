// app/pos/venta-completada/page.tsx
import { Suspense } from "react";
import VentaCompletadaClient from "./Client";

export const dynamic = "force-dynamic"; // evita prerender estatico

export default function VentaCompletadaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          Cargando…
        </div>
      }
    >
      <VentaCompletadaClient />
    </Suspense>
  );
}
