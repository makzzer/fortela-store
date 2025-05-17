"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { QrCode, Camera, CameraOff } from "lucide-react"

interface QRScannerProps {
  onScan: (code: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<any>(null) // `Html5Qrcode` se carga dinámicamente

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current
          .stop()
          .then(() => scannerRef.current.clear())
          .catch((err: any) => console.error("Error stopping scanner:", err))
      }
    }
  }, [isScanning])

  const startScanner = async () => {
    setError(null)
    setIsScanning(true)

    try {
      const { Html5Qrcode } = await import("html5-qrcode")

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader")
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          onScan(decodedText)
          stopScanner()
        },
        (errorMessage: string) => {
          console.log("Scan error:", errorMessage)
        }
      )
    } catch (err) {
      console.error("Error starting scanner:", err)
      setError("No se pudo iniciar la cámara. Verificá los permisos.")
      setIsScanning(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
      } catch (err) {
        console.error("Error al detener la cámara:", err)
      }
    }
    setIsScanning(false)
  }

  return (
    <div>
      <Card className="overflow-hidden">
        <div id="qr-reader" ref={containerRef} className="w-full h-64 relative">
          {!isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
              <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center px-4">
                {error || "La cámara aparecerá aquí al iniciar el escaneo"}
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4">
        {!isScanning ? (
          <Button onClick={startScanner} className="w-full">
            <Camera className="mr-2 h-4 w-4" /> Iniciar cámara
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="outline" className="w-full">
            <CameraOff className="mr-2 h-4 w-4" /> Detener cámara
          </Button>
        )}
      </div>
    </div>
  )
}
