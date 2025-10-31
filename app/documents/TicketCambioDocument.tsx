import { Document, Page, Head } from "@htmldocs/react";

export type TicketItem = {
  sku: string;
  descripcion: string;
  talle?: string;
  cantidad: number;
  colegio?: string;
  precio: number;
  importe?: number;
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

export default function TicketCambioDocument({
  numero,
  fecha,
  cliente,
  ordenId,
  comercio,
  items,
  total,
}: TicketProps) {
  // cuántos renglones querés “vacíos” para completar a mano si hace falta
  const LINES = 12;
  const blanks = Math.max(0, LINES - items.length);

  return (
    <Document size="A4" orientation="portrait" margin="16mm">
      <Head>
        <meta charSet="utf-8" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style>{`
          :root {
            --ink:#111;
            --muted:#6b7280;
            --line:#d7dade;
            --line-strong:#b5bbc3;
            --accent:#111;
          }
          * { box-sizing: border-box; font-family: Inter, system-ui, -apple-system, Arial; color: var(--ink); }
          h1,h2,h3 { margin:0; }
          .sheet { border: 1.5px solid var(--line-strong); border-radius: 10pt; padding: 14pt; }
          .muted { color: var(--muted); }
          .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
          .hr { border-top: 1px solid var(--line); margin: 10pt 0; }

          /* Header */
          .hdr { display:grid; grid-template-columns: 1fr auto; gap: 12pt; align-items:center; }
          .brand { display:grid; grid-template-columns: auto 1fr; gap: 12pt; align-items:center; }
          .seal { display:grid; place-items:center; width: 34pt; height: 34pt; border: 1.5px solid var(--ink); border-radius: 6pt; font-weight:700; }
          .brand-name { font-size: 12.5pt; font-weight: 700; letter-spacing: .8px; }
          .brand-sub { font-size: 8.5pt; line-height: 1.25; }

          .title { display:grid; gap:4pt; text-align:right; }
          .badge { font-size: 10pt; font-weight:600; }
          .meta { font-size: 9pt; }
          .meta .lbl { color: var(--muted); margin-right: 4pt; }

          /* Info fiscal */
          .fiscal { display:grid; grid-template-columns: 1fr 1fr; gap:10pt; font-size:9pt; }
          .fiscal b { font-weight:600; }
          .boxline { border: 1px solid var(--line); border-radius: 6pt; padding:8pt 10pt; }

          /* Campos “para completar a mano” */
          .write { display:grid; grid-template-columns: 90pt 1fr; gap: 10pt; align-items:center; }
          .write + .write { margin-top: 8pt; }
          .write .label { font-size: 9.5pt; color: var(--muted); }
          .write .line { border-bottom: 1.5px solid var(--line-strong); height: 14pt; }
          .hint { font-size:8pt; color: var(--muted); margin-top: 2pt; }

          /* Tabla */
          table { width:100%; border-collapse: collapse; }
          thead th {
            font-size: 9pt; text-transform: uppercase; letter-spacing: .4px;
            border-bottom: 1.5px solid var(--line-strong); padding: 6pt 4pt; text-align:left;
          }
          tbody td {
            font-size: 9.5pt; padding: 7pt 4pt; border-bottom: 1px dashed var(--line);
          }
          .right { text-align:right; }
          .center { text-align:center; }

          .totals { display:grid; grid-template-columns: 1fr auto; align-items:center; margin-top: 10pt; }
          .grand { font-size: 12pt; font-weight: 700; padding: 6pt 10pt; border: 1.5px solid var(--line-strong); border-radius: 6pt; }

          /* Pie */
          .foot { display:grid; grid-template-columns: 1fr 1fr; gap: 16pt; margin-top: 14pt; font-size: 9pt; }
          .sign { height: 24pt; border-bottom: 1px solid var(--line-strong); }
          .legal { color: var(--muted); font-size: 8pt; }

          /* Pequeños helpers */
          .mt4{ margin-top:4pt } .mt6{ margin-top:6pt } .mt8{ margin-top:8pt } .mt10{ margin-top:10pt } .mt12{ margin-top:12pt }
        `}</style>
      </Head>

      <Page>
        <div className="sheet">
          {/* Header */}
          <div className="hdr">
            <div className="brand">
              <div className="seal">X</div>
              <div>
                <div className="brand-name">{comercio.nombre}</div>
                <div className="brand-sub">
                  {comercio.direccion}
                  <br />
                  {comercio.localidad}
                  <br />
                  {comercio.telefono ? <> {comercio.telefono}</> : null}
                  {comercio.iva ? <><br />{comercio.iva}</> : null}
                </div>
              </div>
            </div>

            <div className="title">
              <div className="badge">TICKET DE CAMBIO <span className="muted">(30 días)</span></div>
              <div className="meta mono">
                <span className="lbl">Fecha:</span>{fecha}
              </div>
              <div className="meta mono">
                {ordenId && (<><span className="lbl">Orden:</span>{ordenId.slice(0,5)} · </>)}
                <span className="lbl">N°:</span>{numero}
              </div>
            </div>
          </div>

          <div className="hr" />

          {/* Datos fiscales compactos */}
          <div className="fiscal">
            <div className="boxline">
              {comercio.cuit && (<div className="mono"><b>CUIT:</b> {comercio.cuit}</div>)}
              {comercio.iibb && (<div className="mono"><b>Ing. Brutos:</b> {comercio.iibb}</div>)}
              {comercio.inicioActividades && (<div className="mono"><b>Inicio de Actividades:</b> {comercio.inicioActividades}</div>)}
            </div>
            <div className="boxline">
              <div className="muted">Condición de venta:</div>
              <div className="mt4">
                <span className="mono">[  ] Contado</span>&nbsp;&nbsp;&nbsp;
                <span className="mono">[  ] Cta. Cte.</span>
              </div>
            </div>
          </div>

          <div className="hr" />

          {/* Campos para completar a mano */}
          <div className="write">
            <div className="label">Señor/a</div>
            <div>
              <div className="line" />
              {/*{cliente ? <div className="hint">Sugerido: {cliente}</div> : null}*/}
            </div>
          </div>
          <div className="write">
            <div className="label">Calle</div>
            <div><div className="line" /></div>
          </div>
          <div className="write">
            <div className="label">Loc.</div>
            <div><div className="line" /></div>
          </div>

          <div className="mt10" />

          {/* Tabla de ítems */}
          <table>
            <thead>
              <tr>
                <th style={{ width: "12%" }}>Cantidad</th>
                <th>Descripción</th>
                <th>Colegio</th>
                <th style={{ width: "14%" }}>Talle</th>
                <th className="right" style={{ width: "16%" }}>P. Unit</th>
                <th className="right" style={{ width: "16%" }}>Importe</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={`${it.sku}-${idx}`}>
                  <td className="mono center">{it.cantidad}</td>
                  <td className="mono">{it.descripcion}</td>
                  <td className="mono">{it.colegio||"no vino pa"}</td>
                  <td className="mono center">{it.talle || "-"}</td>
                  <td className="mono right">${it.precio.toFixed(2)}</td>
                  <td className="mono right">${(it.precio * it.cantidad).toFixed(2)}</td>
                </tr>
              ))}
              {/* Renglones vacíos para anotar a mano si hace falta */}
              {Array.from({ length: blanks }).map((_, i) => (
                <tr key={`blank-${i}`}>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="totals">
            <div />
            <div className="grand mono">Total: ${total.toFixed(2)}</div>
          </div>

          {/* Pie */}
          <div className="foot">
            <div>
              <div className="sign" />
              <div className="muted">Firma y aclaración</div>
            </div>
            <div className="legal">
              • El ticket de cambio tiene validez de 30 días. • Presentar este
              comprobante para gestionar cambios. • Las prendas deben conservar
              etiquetas y estar en perfecto estado.
            </div>
          </div>
        </div>

      </Page>
    </Document>
  );
}
