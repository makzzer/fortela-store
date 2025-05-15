"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { type ReactNode } from "react"

interface Order {
  id: number
  total: number
  date: string
  status: string
  tipo_venta: string
}

interface Props {
  order: Order
  children: ReactNode
}

export default function OrderDetailsModal({ order, children }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Details - ORD-{order.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="font-semibold">Date:</span>
            <span>{order.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Total:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Status:</span>
            <span>{order.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Type:</span>
            <span>{order.tipo_venta}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
