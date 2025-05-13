"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import QRScanner from "@/components/admin/qr-scanner"
import StockUpdateForm from "@/components/admin/stock-update-form"
import { Search, QrCode, Scan } from "lucide-react"

export default function StockManagementPage() {
  const [scannedCode, setScannedCode] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = (code: string) => {
    setScannedCode(code)
    setIsScanning(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Stock Management</h1>

      <Tabs defaultValue="scanner" className="mb-8">
        <TabsList>
          <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Scan Product QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              {isScanning ? (
                <div className="space-y-4">
                  <QRScanner onScan={handleScan} />
                  <Button variant="outline" onClick={() => setIsScanning(false)} className="w-full">
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button onClick={() => setIsScanning(true)} className="w-full">
                    <Scan className="mr-2 h-4 w-4" /> Start Scanning
                  </Button>

                  {scannedCode && (
                    <div className="mt-6">
                      <div className="bg-muted p-3 rounded-md mb-4">
                        <div className="text-sm text-muted-foreground mb-1">Scanned Product:</div>
                        <div className="font-medium flex items-center">
                          <QrCode className="h-4 w-4 mr-2" />
                          {scannedCode}
                        </div>
                      </div>

                      <StockUpdateForm productId={scannedCode} />
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
              <CardTitle>Manual Stock Update</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search for a product..." className="pl-8" />
                </div>

                <Button className="w-full">Search</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
