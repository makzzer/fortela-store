"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { QrCode, Camera, CameraOff } from "lucide-react"

interface QRScannerProps {
  onScan: (code: string) => void
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize scanner
    if (containerRef.current && !scannerRef.current) {
      scannerRef.current = new Html5Qrcode("qr-reader")
    }

    // Cleanup on unmount
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch((error) => console.error("Error stopping scanner:", error))
      }
    }
  }, [isScanning])

  const startScanner = async () => {
    setError(null)
    setIsScanning(true)

    try {
      if (scannerRef.current) {
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText)
            stopScanner()
          },
          (errorMessage) => {
            console.log(errorMessage)
          },
        )
      }
    } catch (err) {
      setError("Failed to start camera. Please make sure you've granted camera permissions.")
      setIsScanning(false)
      console.error("Error starting scanner:", err)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
      } catch (error) {
        console.error("Error stopping scanner:", error)
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
                {error || "Camera will appear here when scanning starts"}
              </p>
            </div>
          )}
        </div>
      </Card>

      <div className="mt-4">
        {!isScanning ? (
          <Button onClick={startScanner} className="w-full">
            <Camera className="mr-2 h-4 w-4" /> Start Camera
          </Button>
        ) : (
          <Button onClick={stopScanner} variant="outline" className="w-full">
            <CameraOff className="mr-2 h-4 w-4" /> Stop Camera
          </Button>
        )}
      </div>
    </div>
  )
}
