// app/api/pos/route.ts  (o el route que uses para el ticket del POS)
import "server-only";
import { NextRequest } from "next/server";
import React from "react";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";
import TicketCambioDocument, {
  TicketProps,
  TicketItem,
} from "@/app/documents/TicketCambioDocument";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function findLocalChrome(): string | undefined {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
      : undefined,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean) as string[];
  return candidates.find((p) => existsSync(p));
}

// Trae ítems de la orden con variantes por talle pobladas
async function fetchItemsByOrdenId(
  ordenId: string
): Promise<(TicketItem & { importe?: number })[]> {
  const url = new URL(
    "https://vps-4937880-x.dattaweb.com/api/fortela-items-comprados"
  );
  url.searchParams.set("filters[fortela_orden][documentId][$eq]", ordenId);
  url.searchParams.set(
    "populate[fortela_producto][populate]",
    "variantesPorTalle"
  );
  url.searchParams.set("pagination[limit]", "100");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudieron obtener los ítems");
  const { data = [] } = await res.json();

  return (data as any[]).map((it) => {
    const cantidad = Number(it?.cantidad ?? 1);
    const talle = it?.talle;

    // prioridad: precio_unitario → variante por talle → precio base del producto
    const variantePrice = it?.fortela_producto?.variantesPorTalle?.find(
      (v: any) => v?.talle === talle
    )?.precio;

    const precioUnit =
      typeof it?.precio_unitario === "number"
        ? Number(it.precio_unitario)
        : typeof variantePrice === "number"
        ? Number(variantePrice)
        : Number(it?.fortela_producto?.precio ?? 0);

    const importe =
      typeof it?.importe === "number"
        ? Number(it.importe)
        : precioUnit * cantidad;

    return {
      sku: it?.fortela_producto?.sku ?? `SKU-${it?.id}`,
      descripcion:
        it?.fortela_producto?.nombre ??
        it?.fortela_producto?.descripcion ??
        "Producto",
      talle: talle ?? "-",
      cantidad,
      precio: precioUnit,
      importe,
    } as TicketItem & { importe?: number };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TicketProps> & {
      ordenId?: string;
    };

    // Ítems del ticket (si viene ordenId, los buscamos)
    const items =
      body.ordenId != null
        ? await fetchItemsByOrdenId(body.ordenId)
        : ((body.items ?? []) as (TicketItem & { importe?: number })[]);

    // Total = suma de importes (fallback a precio*cantidad si faltara)
    const totalCalc = items.reduce(
      (acc, it) =>
        acc + (typeof it.importe === "number" ? it.importe : it.precio * it.cantidad),
      0
    );

    const data: TicketProps = {
      numero: body.numero ?? (body.ordenId ? body.ordenId : "000123"),
      fecha: body.fecha ?? new Date().toLocaleDateString("es-AR"),
      cliente: body.cliente ?? "Consumidor Final",
      ordenId: body.ordenId ?? undefined,
      comercio:
        body.comercio ?? {
          nombre: "FORTELA UNIFORMES",
          direccion: "AV. MARÍA 1000 ESQ. SUSSINI",
          localidad: "(1611) Don Torcuato · Buenos Aires",
          telefono: "11-7360-0824",
          iva: "IVA RESPONSABLE INSCRIPTO",
          cuit: "27-18347414-1",
          iibb: "27-18347414-1",
          inicioActividades: "10/2008",
        },
      items:
        items.length > 0
          ? items
          : [
              {
                sku: "SKU-1",
                descripcion: "Sample item",
                talle: "L",
                cantidad: 1,
                precio: 100,
                importe: 100,
              },
            ],
      total: typeof body.total === "number" ? body.total : totalCalc,
    };

    // Render PDF igual que tu ticket actual
    const ReactDOMServer = await import("react-dom/server");
    const html =
      "<!doctype html>" +
      ReactDOMServer.renderToStaticMarkup(
        React.createElement(TicketCambioDocument, data)
      );

    const isProd = process.env.NODE_ENV === "production";
    const executablePath = isProd
      ? await chromium.executablePath()
      : findLocalChrome();
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
          "Content-Disposition": 'inline; filename="ticket-pos.pdf"',
          "Cache-Control": "no-store",
        },
      });
    } finally {
      await browser.close();
    }
  } catch (err) {
    console.error("POS ticket error:", err);
    return new Response("Failed to generate POS ticket", { status: 500 });
  }
}
