// app/api/ticket-cambio/route.ts
import "server-only";

import { NextRequest } from "next/server";
import React from "react";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
import TicketCambioDocument, { TicketProps, TicketItem } from "@/app/documents/TicketCambioDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// En dev (Windows/Mac/Linux) buscamos Chrome local; en prod Vercel usamos @sparticuz/chromium
function findLocalChrome(): string | undefined {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe` : undefined,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean) as string[];
  return candidates.find((p) => existsSync(p));
}

// fetch de items reales (mismo endpoint que tu modal)
async function fetchItemsByOrdenId(ordenId: string): Promise<TicketItem[]> {
  const URL_API = "https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados?populate=*";
  const res = await fetch(URL_API, { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudieron obtener los ítems");

  const json = await res.json();
  const filtered = (json?.data ?? []).filter(
    (it: any) => it?.fortela_orden?.documentId === ordenId
  );

  const mapped: TicketItem[] = filtered.map((it: any) => ({
    sku: it?.fortela_producto?.sku ?? `SKU-${it?.id}`,
    descripcion: it?.fortela_producto?.nombre ?? it?.fortela_producto?.descripcion ?? "Producto",
    talle: it?.talle ?? "-",
    cantidad: Number(it?.cantidad ?? 1),
    precio: Number(it?.fortela_producto?.precio ?? 0),
  }));

  return mapped;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TicketProps> & { ordenId?: string };

    // 1) Traemos ítems reales si nos pasás ordenId
    const items = body.ordenId ? await fetchItemsByOrdenId(body.ordenId) : (body.items ?? []);

    // 2) Calculamos total si no viene
    const totalCalc = items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);

    const data: TicketProps = {
      numero: body.numero ?? (body.ordenId ? body.ordenId : "000123"),
      fecha: body.fecha ?? new Date().toLocaleDateString("es-AR"),
      cliente: body.cliente ?? "Consumidor Final",
      ordenId: body.ordenId ?? undefined,
      comercio: body.comercio ?? {
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

    // Render del documento a HTML (import dinámico para no romper Next)
    const ReactDOMServer = await import("react-dom/server");
    const html =
      "<!doctype html>" +
      ReactDOMServer.renderToStaticMarkup(React.createElement(TicketCambioDocument, data));

    // Lanzamos Chromium: prod usa @sparticuz/chromium, dev usa Chrome local
    const isProd = process.env.NODE_ENV === "production";
    const executablePath = isProd ? await chromium.executablePath() : findLocalChrome();
    if (!executablePath) {
      console.error("Chrome no encontrado en dev. Seteá PUPPETEER_EXECUTABLE_PATH.");
      return new Response("Chrome no encontrado", { status: 500 });
    }

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
        format: "A4",
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
    console.error("PDF error:", err);
    return new Response("Failed to generate PDF", { status: 500 });
  }
}
