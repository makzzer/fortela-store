"use client";

import { useRef } from "react";

interface Item {
  id: number;
  cantidad: number;
  talle: string;
  producto: {
    nombre: string;
    descripcion: string;
    precio: number;
  };
}

interface Props {
  items: Item[];
  documentId: string;
  fecha: string;
}

export default function CambioTicketPreview({ items, documentId, fecha }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML;
    const originalContents = document.body.innerHTML;

    if (printContents) {
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // recargar para volver a la vista original
    }
  };

  const total = items.reduce(
    (sum, item) => sum + item.cantidad * item.producto.precio,
    0
  );

  return (
    <div className="relative">
      {/* Botón imprimir (no se imprime) */}
      <div className="mb-4 print:hidden text-right">
        <button
          onClick={handlePrint}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm"
        >
          🖨️ Imprimir / Descargar
        </button>
      </div>

      {/* Contenido imprimible */}
      <div ref={printRef} className="p-6 font-mono text-xs border rounded-md bg-white text-black space-y-3 max-w-3xl mx-auto">
        {/* Encabezado Fortela */}
        <div className="text-center space-y-1 border-b pb-2">
          <h2 className="text-lg font-bold uppercase">FORTELA UNIFORMES</h2>
          <p>de Miño Marina Beatriz</p>
          <p>AV. MARIA 1400 ESQ. SUSSINI</p>
          <p>(1611) DON TORCUATO - PCIA. DE BUENOS AIRES</p>
          <p>📞 11-7360-0824</p>
          <p className="font-semibold">IVA RESPONSABLE INSCRIPTO</p>
        </div>

        {/* Título del ticket */}
        <div className="flex justify-between items-center border-b pb-2">
          <p className="font-bold text-sm">TICKET DE CAMBIO (30 DÍAS)</p>
          <div className="text-right">
            <p className="text-xs">FECHA: {fecha}</p>
            <p className="text-xs">ORDEN: {documentId}</p>
          </div>
        </div>

        {/* Datos Fiscales de Fortela */}
        <div className="text-xs space-y-1 border-b pb-2">
          <p><strong>CUIT:</strong> 27-18347414-1</p>
          <p><strong>ING. BRUTOS:</strong> 27-18347414-1</p>
          <p><strong>Inicio de Actividades:</strong> 10/2008</p>
        </div>

        {/* Datos del cliente */}
        <div className="space-y-1 border-b pb-2">
          <p><strong>Señor/a:</strong> ______________________________</p>
          <p><strong>Calle:</strong> ______________________________</p>
          <p><strong>Loc.:</strong> ______________________________</p>
          <p className="flex gap-4">
            <span><strong>I.V.A.:</strong> Resp. Inscripto ☐  No Inscripto ☐  Monotributo ☐</span>
            <span>Exento ☐  Cons. Final ☐</span>
          </p>
          <p><strong>CUIT:</strong> ______________________________</p>
          <p className="flex gap-4">
            <span><strong>Condición de Venta:</strong> Contado ☐</span>
            <span>Cuenta Corriente ☐</span>
          </p>
        </div>

        {/* Tabla de productos */}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="text-left py-1">CANTIDAD</th>
              <th className="text-left py-1">DESCRIPCIÓN</th>
              <th className="text-center py-1">TALLE</th>
              <th className="text-right py-1">P. UNIT</th>
              <th className="text-right py-1">IMPORTE</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b">
                <td>{item.cantidad}</td>
                <td>{item.producto.nombre}</td>
                <td className="text-center">{item.talle}</td>
                <td className="text-right">${item.producto.precio.toFixed(2)}</td>
                <td className="text-right">
                  ${(item.producto.precio * item.cantidad).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="text-right mt-2 font-bold text-sm">
          TOTAL: ${total.toFixed(2)}
        </div>
      </div>
    </div>
  );
}