// app/api/ticket-cambio/pos/route.ts
import "server-only";

import { NextRequest } from "next/server";
import React from "react";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
import TicketCambioDocument, { TicketItem, TicketProps } from "@/app/documents/TicketCambioDocument";

// en vercel usamos chromium; en dev (windows/mac/linux) usamos chrome local
function findLocalChrome(): string | undefined {
  const cands = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean) as string[];
  return cands.find((p) => existsSync(p));
}

async function fetchItemsByOrdenNumericId(ordenNumericId: number): Promise<TicketItem[]> {
  const URL_API = "https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados?populate=*";
  const res = await fetch(URL_API, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudieron obtener los ítems");
  const json = await res.json();

  const mapped: TicketItem[] = (json?.data ?? [])
    .filter((it: any) => it?.fortela_orden?.id === ordenNumericId)
    .map((it: any) => ({
      sku: it?.fortela_producto?.sku ?? `SKU-${it?.id}`,
      descripcion: it?.fortela_producto?.nombre ?? it?.fortela_producto?.descripcion ?? "Producto",
      talle: it?.talle ?? "-",
      cantidad: Number(it?.cantidad ?? 1),
      precio: Number(it?.fortela_producto?.precio ?? 0),
    }));

  return mapped;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      ordenNumericId: number;   // 👈 lo manda el POS al finalizar
      numero?: string;
      fecha?: string;
      cliente?: string;
      total?: number;
    };

    if (typeof body.ordenNumericId !== "number") {
      return new Response("Falta ordenNumericId", { status: 400 });
    }

    const items = await fetchItemsByOrdenNumericId(body.ordenNumericId);
    const totalCalc = items.reduce((a, it) => a + it.precio * it.cantidad, 0);

    const data: TicketProps = {
      numero: body.numero ?? `ORD-${body.ordenNumericId}`,
      fecha: body.fecha ?? new Date().toLocaleDateString("es-AR"),
      cliente: body.cliente ?? "Consumidor Final",
      ordenId: String(body.ordenNumericId),
      comercio: {
        nombre: "FORTELA UNIFORMES",
        direccion: "AV. MARÍA 1000 ESQ. SUSSINI",
        localidad: "(1611) Don Torcuato · Buenos Aires",
        telefono: "11-7360-0824",
        iva: "IVA RESPONSABLE INSCRIPTO",
        cuit: "27-18347414-1",
        iibb: "27-18347414-1",
        inicioActividades: "10/2008",
      },
      items: items.length ? items : [{ sku: "SKU-1", descripcion: "Sample item", talle: "L", cantidad: 1, precio: 100 }],
      total: typeof body.total === "number" ? body.total : totalCalc,
    };

    // import dinámico para evitar el build error de Next
    const ReactDOMServer = await import("react-dom/server");
    const html = "<!doctype html>" + ReactDOMServer.renderToStaticMarkup(React.createElement(TicketCambioDocument, data));

    const isProd = process.env.NODE_ENV === "production";
    const executablePath = isProd ? await chromium.executablePath() : findLocalChrome();
    if (!executablePath) return new Response("Chrome no encontrado en dev", { status: 500 });

    const browser = await puppeteer.launch({
      args: isProd ? chromium.args : [],
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      await page.emulateMediaType("screen");

      const pdfBuffer = await page.pdf({
        format: "A4", // más adelante, si querés térmica, cambiamos el layout
        printBackground: true,
        margin: { top: "16mm", right: "16mm", bottom: "16mm", left: "16mm" },
      });

      return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="ticket-cambio.pdf"',
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error("POS ticket error:", err);
    return new Response("Failed to generate POS ticket PDF", { status: 500 });
  }
}
