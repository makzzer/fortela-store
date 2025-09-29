import { Document, Page, Head, Footer} from "@htmldocs/react";

export type TicketItem = {
  sku: string;
  descripcion: string;
  talle?: string;
  cantidad: number;
  precio: number;
};

export type TicketProps = {
  numero: string;
  fecha: string;
  cliente?: string;
  ordenId?: string;
  comercio: {
    nombre: string;
    direccion: string;
    localidad: string;
    telefono?: string;
    iva?: string;
    cuit?: string;
    iibb?: string;
    inicioActividades?: string;
  };
  items: TicketItem[];
  total: number;
};

// arriba del componente (en el mismo archivo)
const Gap = ({ h = "8pt" }: { h?: string | number }) => (
  <div style={{ height: typeof h === "number" ? `${h}px` : h }} />
);


export default function TicketCambioDocument({
  numero,
  fecha,
  cliente = "Consumidor Final",
  ordenId,
  comercio,
  items,
  total,
}: TicketProps) {
  const fmt = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 });

  return (
    <Document size="A4" orientation="portrait" margin="16mm">
      <Head>
        <meta charSet="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --fg: #111827; /* gray-900 */
            --muted: #6b7280; /* gray-500 */
            --border: #e5e7eb; /* gray-200 */
            --bg-subtle: #f9fafb; /* gray-50 */
            --accent: #0ea5e9; /* sky-500 */
          }
          * { font-family: Inter, system-ui, Arial; color: var(--fg); }
          h1,h2,h3 { margin:0; }
          .heading { font-weight: 700; letter-spacing: .2px; }
          .subtle { color: var(--muted); }
          .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
          .grid { display:grid; gap: 8pt; }
          .grid-cols-2 { grid-template-columns: 1fr auto; align-items: start; }
          .hr { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 10pt 0; }
          .card { background: white; border: 1px solid var(--border); border-radius: 10pt; padding: 10pt 12pt; }
          table { width:100%; border-collapse: collapse; font-size:10pt; }
          thead th {
            text-align:left; font-weight:600; padding: 8pt 6pt;
            background: var(--bg-subtle); border-bottom: 1px solid var(--border);
          }
          tbody td { padding: 7pt 6pt; border-bottom: 1px solid var(--border); }
          tbody tr:nth-child(even) { background: #fcfcfd; }
          .right { text-align:right; }
          .muted { color: var(--muted); }
          .kpi { font-weight: 600; }
          .title { font-size: 18pt; }
          .label { font-size: 9pt; color: var(--muted); }
          .total { font-size: 12pt; font-weight: 700; }
          .caps { text-transform: uppercase; letter-spacing: .3px; }
          .chip { display:inline-block; padding: 2pt 6pt; border-radius: 9999px; background: var(--bg-subtle); border:1px solid var(--border); font-size:9pt; }
        `}</style>
      </Head>

      <Page>
        {/* Encabezado */}
        <div className="grid grid-cols-2">
          <div>
            <div className="title heading">{comercio.nombre}</div>
            <div className="subtle">{comercio.direccion}</div>
            <div className="subtle">{comercio.localidad}</div>
            {comercio.telefono && <div className="subtle">{comercio.telefono}</div>}
            {comercio.iva && <div className="subtle">{comercio.iva}</div>}
          </div>
          <div className="right">
            <div className="caps label">Ticket de cambio</div>
            <div className="chip">validez 30 días</div>
            <Gap h="6pt" />
            <div className="mono subtle">Fecha: {fecha}</div>
            {ordenId && <div className="mono subtle">Orden: {ordenId}</div>}
            <div className="mono kpi">N°: {numero}</div>
          </div>
        </div>

        <div className="hr" />

        {/* Datos fiscales */}
        <div className="card">
          <div className="grid grid-cols-2">
            <div>
              {comercio.cuit && <div className="mono">CUIT: {comercio.cuit}</div>}
              {comercio.iibb && <div className="mono">Ing. Brutos: {comercio.iibb}</div>}
              {comercio.inicioActividades && (
                <div className="mono">Inicio de Actividades: {comercio.inicioActividades}</div>
              )}
            </div>
            <div className="right">
              <div className="label">Cliente</div>
              <div className="mono">{cliente}</div>
            </div>
          </div>
        </div>

        <Gap h="10pt" />

        {/* Ítems */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "12%" }}>Cant.</th>
              <th>Descripción</th>
              <th style={{ width: "16%" }}>Talle</th>
              <th className="right" style={{ width: "18%" }}>P. Unit</th>
              <th className="right" style={{ width: "18%" }}>Importe</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={`${it.sku}-${it.talle ?? ""}`}>
                <td className="mono">{it.cantidad}</td>
                <td className="mono">{it.descripcion}</td>
                <td className="mono">{it.talle ?? "-"}</td>
                <td className="mono right">{fmt(it.precio)}</td>
                <td className="mono right">{fmt(it.precio * it.cantidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <Gap h="6pt" />

        <div className="grid grid-cols-2">
          <div className="subtle label">
            Cambios sujetos a stock. Prendas sin uso, con etiquetas y ticket. No válido como factura.
          </div>
          <div className="right total">Total: {fmt(total)}</div>
        </div>
      </Page>

      <Footer />
    </Document>
  );
}
