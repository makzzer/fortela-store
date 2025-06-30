"use client"

import { useState, useEffect } from "react"
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

interface Producto {
  id: number
  documentId: string
  nombre: string
  variantesPorTalle: {
    talle: string
    cantidad: number
    precio: number
  }[]
}

export default function StockManagementPage() {
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [producto, setProducto] = useState<Producto | null>(null)
  const [talleSeleccionado, setTalleSeleccionado] = useState<string | null>(null)

  // Al escanear código
  const handleScan = async (code: string) => {
    setScannedCode(code)
    setIsScanning(false)
    setProducto(null)
    setTalleSeleccionado(null)
  
    try {
      const res = await fetch(`https://vps-4937880-x.dattaweb.com/api/productos?filters[documentId][$eq]=${code}&populate=*`)
      const data = await res.json()
      const rawProducto = data.data?.[0]
  
      console.log("🧩 Producto encontrado:", rawProducto) // ✅ Agregado el print
  
      if (!rawProducto) {
        Swal.fire("Producto no encontrado", `No se encontró ningún producto con ID: ${code}`, "error")
        return
      }
  
      const variantes = rawProducto.variantesPorTalle || []
  
      if (!variantes.length) {
        Swal.fire("Sin variantes", "Este producto no tiene stock por talle", "warning")
        return
      }
  
      setProducto({
        id: rawProducto.id,
        documentId: rawProducto.documentId,
        nombre: rawProducto.nombre,
        variantesPorTalle: variantes,
      })
    } catch (error) {
      console.error("❌ Error al buscar producto:", error)
      Swal.fire("Error", "Ocurrió un error al buscar el producto", "error")
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

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Seleccionar talle:</p>
                        <Select onValueChange={setTalleSeleccionado}>
                          <SelectTrigger>
                            <SelectValue placeholder="Elegí un talle" />
                          </SelectTrigger>
                          <SelectContent>
                            {producto.variantesPorTalle.map((v) => (
                              <SelectItem key={v.talle} value={v.talle}>
                                {v.talle} - {v.cantidad} unidades
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {talleSeleccionado && (
                        <StockUpdateForm
                          productId={producto.documentId}
                          talle={talleSeleccionado}
                        />
                      )}
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
