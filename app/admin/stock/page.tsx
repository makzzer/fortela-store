"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import QRScanner from "@/components/admin/qr-scanner"
import StockUpdateForm from "@/components/admin/stock-update-form"
import { Search, QrCode, Scan } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Swal from "sweetalert2"

type VarianteTalle = {
  talle: string
  cantidad: number
  precio?: number
}

interface Producto {
  id: number
  documentId: string
  nombre: string
  variantesPorTalle: VarianteTalle[]
  variantesPorColegio?: Array<{
    id?: number
    colegio: string
    variantesPorTalles?: VarianteTalle[] // nombre esperado
    variantesPorTalle?: VarianteTalle[]  // por si viene con este nombre
  }>
}

/** ====== QR NORMALIZER SÚPER ROBUSTO ======
 * Acepta: documentId directo, URL absoluta, ruta relativa, query (?id= / ?documentId=)
 * y además busca por regex una cadena base36 de 24 chars (formato típico de tus IDs).
 */
const DOCID_REGEX = /[a-z0-9]{24}/i
const normalizeQr = (raw: string) => {
  if (!raw) return ""

  const trimmed = String(raw).trim()
  console.log("🔍 QR RAW:", trimmed)

  // 1) ¿ya es un documentId "puro"?
  if (DOCID_REGEX.test(trimmed) && !/[\/\s]/.test(trimmed) && trimmed.length === 24) {
    const m = trimmed.match(DOCID_REGEX)
    return (m?.[0] || "").toLowerCase()
  }

  // 2) Intentar como URL absoluta
  try {
    if (trimmed.startsWith("http")) {
      const u = new URL(trimmed)
      // a) query params comunes
      const qDocId = u.searchParams.get("documentId") || u.searchParams.get("id")
      if (qDocId && DOCID_REGEX.test(qDocId)) return qDocId.match(DOCID_REGEX)![0].toLowerCase()
      // b) último segmento de la ruta
      const last = u.pathname.split("/").filter(Boolean).at(-1) || ""
      if (DOCID_REGEX.test(last)) return last.match(DOCID_REGEX)![0].toLowerCase()
      // c) como último recurso, buscar en todo el string
      const any = trimmed.match(DOCID_REGEX)?.[0]
      if (any) return any.toLowerCase()
    }
  } catch {
    // no-op
  }

  // 3) Ruta relativa (/productos/{id}, /vehiculos/{id}, etc.)
  const parts = trimmed.split(/[/?#]/).filter(Boolean)
  const last = parts.at(-1) || ""
  if (DOCID_REGEX.test(last)) return last.match(DOCID_REGEX)![0].toLowerCase()

  // 4) Buscar en cualquier lado
  const any = trimmed.match(DOCID_REGEX)?.[0]
  return (any || "").toLowerCase()
}

/** Saca variantes desde raíz o sumando por colegio */
const buildVariantesUsables = (raw: any): VarianteTalle[] => {
  const root = Array.isArray(raw?.variantesPorTalle) ? raw.variantesPorTalle : []
  console.log("🔎 root.variantesPorTalle:", root)

  const rootValidas = root
    .filter((v: any) => v && v.talle != null)
    .map((v: any) => ({
      talle: String(v.talle),
      cantidad: Number(v.cantidad ?? 0),
      precio: v?.precio,
    }))

  if (rootValidas.length) {
    console.log("✅ Usando variantes de raíz:", rootValidas)
    return rootValidas
  }

  const vpc = Array.isArray(raw?.variantesPorColegio) ? raw.variantesPorColegio : []
  console.log("🔎 variantesPorColegio:", vpc)

  const acc = new Map<string, VarianteTalle>()
  for (const c of vpc) {
    const arr: any[] =
      Array.isArray(c?.variantesPorTalles) ? c.variantesPorTalles
        : Array.isArray(c?.variantesPorTalle) ? c.variantesPorTalle
          : []
    for (const v of arr) {
      if (!v || v.talle == null) continue
      const key = String(v.talle)
      const cant = Number(v.cantidad ?? 0)
      const prev = acc.get(key)
      acc.set(key, {
        talle: key,
        cantidad: (prev?.cantidad ?? 0) + cant,
        precio: prev?.precio ?? v?.precio,
      })
    }
  }

  const compact = Array.from(acc.values())
  console.log("🧮 Variantes sumadas por colegio:", compact)
  return compact
}

export default function StockManagementPage() {
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [producto, setProducto] = useState<Producto | null>(null)
  const [talleSeleccionado, setTalleSeleccionado] = useState<string | null>(null)
  const [colegioSeleccionado, setColegioSeleccionado] = useState<string | null>(null)


  const handleScan = async (rawCode: string) => {
    setIsScanning(false)
    setProducto(null)
    setTalleSeleccionado(null)

    const code = normalizeQr(rawCode)
    setScannedCode(code)

    // Validación de ID: si queda vacío o raro, no sigas
    if (!code || !DOCID_REGEX.test(code) || code.length !== 24) {
      console.error("❗ QR inválido / documentId no detectado:", { rawCode, normalizado: code })
      await Swal.fire({
        icon: "error",
        title: "QR inválido",
        html: `
          No pude detectar un <b>documentId</b> válido en el QR.<br/><br/>
          RAW: <code>${rawCode}</code><br/>
          Normalizado: <code>${code || "(vacío)"}</code>
        `,
        width: 700,
      })
      return
    }

    const url = `https://vps-4937880-x.dattaweb.com/api/productos
?filters[documentId][$eq]=${encodeURIComponent(code)}
&populate[variantesPorTalle]=*
&populate[variantesPorColegio][populate][variantesPorTalles]=*
&pagination[pageSize]=1`.replace(/\s+/g, "")


    console.log("📡 Buscando producto por documentId:", { rawCode, normalizado: code, url })

    try {
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        console.error("❌ HTTP", res.status, text)
        await Swal.fire({
          icon: "error",
          title: "Error consultando producto",
          html: `HTTP ${res.status}.<br/><pre style="text-align:left;white-space:pre-wrap">${text || "(sin cuerpo)"}</pre>`,
          width: 700,
        })
        return
      }

      const data = await res.json()
      console.log("📦 Respuesta Strapi:", data)

      const items: any[] = Array.isArray(data?.data) ? data.data : []

      // Si Strapi devolvió varios (porque ignoró el filtro), forzamos el match local por documentId
      let rawProducto = items.find((p: any) => p?.documentId === code)
      if (!rawProducto && items.length === 1) rawProducto = items[0]

      if (!rawProducto) {
        await Swal.fire({
          icon: "warning",
          title: "No encontrado",
          html: `No hay producto con <b>documentId</b>: <code>${code}</code>`,
        })
        return
      }

      // Validación extra: si el 1º no coincide, avisá (para detectar el caso de $eq vacío)
      if (rawProducto.documentId !== code) {
        console.warn("⚠️ Mismatch entre solicitado y devuelto:", { solicitado: code, devuelto: rawProducto.documentId })
      }

      const variantesUsables = buildVariantesUsables(rawProducto)

      if (!variantesUsables.length) {
        console.warn("⚠️ Producto sin variantes por talle:", rawProducto)
        await Swal.fire({
          icon: "warning",
          title: "Sin variantes por talle",
          html: `
            Este producto no tiene talles cargados.<br/><br/>
            <b>documentId solicitado:</b> <code>${code}</code><br/>
            <b>documentId devuelto:</b> <code>${rawProducto?.documentId}</code><br/>
            <b>nombre:</b> ${rawProducto?.nombre || "-"}<br/><br/>
            Revisá en Strapi:<br/>
            • Que <code>variantesPorTalle</code> tenga items<br/>
            • o que <code>variantesPorColegio[].variantesPorTalles</code> exista<br/><br/>
            Abrí la consola para ver el objeto completo.
          `,
          width: 700,
        })
        return
      }

      setProducto({
        id: rawProducto.id,
        documentId: rawProducto.documentId,
        nombre: rawProducto.nombre,
        variantesPorTalle: variantesUsables,
        variantesPorColegio: rawProducto.variantesPorColegio,
      })
      setColegioSeleccionado(null)
      setTalleSeleccionado(null)

    } catch (error: any) {
      console.error("💥 Exception buscando producto:", error)
      await Swal.fire({
        icon: "error",
        title: "Excepción",
        html: `<pre style="text-align:left;white-space:pre-wrap">${String(error?.message || error)}</pre>`,
        width: 700,
      })
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Stock Management</h1>

      <Tabs defaultValue="scanner" className="mb-8">
        <TabsList>
          <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
          <TabsTrigger value="manual">Entrada Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Escanear QR del producto</CardTitle>
            </CardHeader>
            <CardContent>
              {isScanning ? (
                <div className="space-y-4">
                  <QRScanner onScan={handleScan} />
                  <Button
                    variant="outline"
                    onClick={() => setIsScanning(false)}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => setIsScanning(true)} className="w-full">
                    <Scan className="mr-2 h-4 w-4" /> Iniciar escaneo
                  </Button>

                  {producto && (
                    <div className="mt-6 space-y-4">
                      <div className="bg-muted p-3 rounded-md">
                        <div className="text-sm text-muted-foreground mb-1">Producto escaneado:</div>
                        <div className="font-medium flex items-center">
                          <QrCode className="h-4 w-4 mr-2" />
                          {producto.nombre} ({producto.documentId})
                        </div>
                      </div>

                      {/* 1) Seleccionar colegio */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground mb-1">Seleccionar colegio:</p>
                        <Select onValueChange={(v) => { setColegioSeleccionado(v); setTalleSeleccionado(null); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Elegí un colegio" />
                          </SelectTrigger>
                          <SelectContent>
                            {(producto.variantesPorColegio || []).map((c) => (
                              <SelectItem key={c.colegio} value={c.colegio}>
                                {c.colegio}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 2) Seleccionar talle del colegio elegido */}
                      {colegioSeleccionado && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground mb-1">Seleccionar talle:</p>
                          <Select onValueChange={setTalleSeleccionado}>
                            <SelectTrigger>
                              <SelectValue placeholder="Elegí un talle" />
                            </SelectTrigger>
                            <SelectContent>
                              {(producto.variantesPorColegio || [])
                                .find((c) => c.colegio === colegioSeleccionado)
                                ?.variantesPorTalles?.map((v) => (
                                  <SelectItem key={`${colegioSeleccionado}-${v.talle}`} value={v.talle}>
                                    {v.talle} — {v.cantidad} unidades
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {colegioSeleccionado && talleSeleccionado && (
                        <StockUpdateForm
                        productName={producto.nombre}
                          productId={producto.documentId}
                          colegio={colegioSeleccionado}
                          talle={talleSeleccionado}
                        />
                      )}


                      {/* Panel de debug (podés quitarlo en prod) */}

                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Actualización manual de stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Buscar un producto..." className="pl-8" />
                </div>
                <Button className="w-full">Buscar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
