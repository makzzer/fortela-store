"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, X, PackageX, SlidersHorizontal } from "lucide-react";

interface VarianteTalle {
  talle: string;
  cantidad: number;
  precio?: number;
}

interface ColegioBlock {
  colegio: string;
  variantesPorTalles: VarianteTalle[];
}

interface Producto {
  id: string;
  documentId: string;
  nombre: string;
  precio: number;
  genero?: string;
  nivel?: string;
  qr_code?: string;
  stock?: number;
  variantesPorColegio?: ColegioBlock[];
  variantesPorTalle?: VarianteTalle[];
}

interface Props {
  productos: Producto[];
  onSelect: (producto: Producto) => void;
}

const ALL = "all";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ProductTableSelector({ productos, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [filterGenero, setFilterGenero] = useState(ALL);
  const [filterColegio, setFilterColegio] = useState(ALL);
  const [showFilters, setShowFilters] = useState(false);

  const generos = useMemo(() => {
    const s = new Set<string>();
    productos.forEach((p) => { if (p.genero) s.add(p.genero); });
    return Array.from(s).sort();
  }, [productos]);

  const colegios = useMemo(() => {
    const s = new Set<string>();
    productos.forEach((p) => {
      (p.variantesPorColegio || []).forEach((c) => s.add(c.colegio));
    });
    return Array.from(s).sort();
  }, [productos]);

  const hasColegios = colegios.length > 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return productos.filter((p) => {
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      if (filterGenero !== ALL && p.genero !== filterGenero) return false;
      if (filterColegio !== ALL) {
        const has = (p.variantesPorColegio || []).some(
          (c) => c.colegio === filterColegio
        );
        if (!has) return false;
      }
      return true;
    });
  }, [productos, search, filterGenero, filterColegio]);

  const hasActiveFilters =
    search || filterGenero !== ALL || filterColegio !== ALL;

  const clearFilters = () => {
    setSearch("");
    setFilterGenero(ALL);
    setFilterColegio(ALL);
  };

  const getStockTotal = (p: Producto): number => {
    if (p.variantesPorColegio?.length) {
      return p.variantesPorColegio
        .flatMap((c) => c.variantesPorTalles || [])
        .reduce((sum, v) => sum + (v.cantidad ?? 0), 0);
    }
    if (p.variantesPorTalle?.length) {
      return p.variantesPorTalle.reduce((sum, v) => sum + (v.cantidad ?? 0), 0);
    }
    return p.stock ?? 0;
  };

  const getTalles = (p: Producto): string[] => {
    if (p.variantesPorColegio?.length) {
      const set = new Set<string>();
      p.variantesPorColegio.forEach((c) =>
        (c.variantesPorTalles || []).forEach((v) => {
          if ((v.cantidad ?? 0) > 0) set.add(v.talle);
        })
      );
      return Array.from(set);
    }
    if (p.variantesPorTalle?.length) {
      return p.variantesPorTalle
        .filter((v) => (v.cantidad ?? 0) > 0)
        .map((v) => v.talle);
    }
    return [];
  };

  const isBasic = (p: Producto) =>
    !p.variantesPorColegio?.length && !p.variantesPorTalle?.length;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Search bar ── */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar producto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Toggle filtros en mobile */}
        {(generos.length > 0 || hasColegios) && (
          <Button
            variant={showFilters || (filterGenero !== ALL || filterColegio !== ALL) ? "secondary" : "outline"}
            size="icon"
            className="shrink-0 sm:hidden"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        )}

        {/* Filtros inline en desktop */}
        <div className="hidden sm:flex gap-2">
          {generos.length > 0 && (
            <Select value={filterGenero} onValueChange={setFilterGenero}>
              <SelectTrigger className="w-32 bg-background">
                <SelectValue placeholder="Género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {generos.map((g) => (
                  <SelectItem key={g} value={g}>{capitalize(g)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasColegios && (
            <Select value={filterColegio} onValueChange={setFilterColegio}>
              <SelectTrigger className="w-40 bg-background">
                <SelectValue placeholder="Colegio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {colegios.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground gap-1.5 px-2"
            >
              <X className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Filtros expandibles en mobile */}
      {showFilters && (
        <div className="sm:hidden flex flex-col gap-2 p-3 rounded-xl border bg-muted/30">
          {generos.length > 0 && (
            <Select value={filterGenero} onValueChange={setFilterGenero}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los géneros</SelectItem>
                {generos.map((g) => (
                  <SelectItem key={g} value={g}>{capitalize(g)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasColegios && (
            <Select value={filterColegio} onValueChange={setFilterColegio}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Colegio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los colegios</SelectItem>
                {colegios.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="self-start gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" /> Limpiar filtros
            </Button>
          )}
        </div>
      )}

      {/* Conteo */}
      <p className="text-xs text-muted-foreground px-0.5">
        {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
        {hasActiveFilters && (
          <span className="text-primary font-medium"> · filtrado{filtered.length !== 1 ? "s" : ""}</span>
        )}
      </p>

      {/* ── Tabla desktop / Cards mobile ── */}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <PackageX className="h-10 w-10 opacity-30" />
          <p className="text-sm">No se encontraron productos</p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* ── MOBILE: stack de cards ── */}
          <div className="flex flex-col gap-2 md:hidden">
            {filtered.map((p) => {
              const stock = getStockTotal(p);
              const talles = getTalles(p);
              const basic = isBasic(p);
              const noStock = stock === 0 && !basic;
              const lowStock = !basic && stock > 0 && stock <= 5;

              return (
                <div
                  key={p.documentId}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug truncate">{p.nombre}</p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      {p.genero && (
                        <span className="text-xs text-muted-foreground">{capitalize(p.genero)}</span>
                      )}
                      {!basic && (
                        <span className={`text-xs font-medium ${noStock ? "text-destructive" : lowStock ? "text-amber-600" : "text-muted-foreground"}`}>
                          {noStock ? "Sin stock" : `${stock} disp.`}
                        </span>
                      )}
                    </div>
                    {talles.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {talles.slice(0, 8).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center px-1.5 py-0 h-5 rounded text-xs bg-secondary text-secondary-foreground font-medium"
                          >
                            {t}
                          </span>
                        ))}
                        {talles.length > 8 && (
                          <span className="text-xs text-muted-foreground">+{talles.length - 8}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Precio + botón */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-semibold tabular-nums">
                      ${(p.precio ?? 0).toLocaleString("es-AR")}
                    </span>
                    <Button
                      size="sm"
                      disabled={noStock}
                      onClick={() => onSelect(p)}
                      className="h-7 px-2.5 gap-1 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Agregar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── DESKTOP: tabla ── */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5">
                    Producto
                  </th>
                  {hasColegios && (
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5 hidden lg:table-cell">
                      Colegio(s)
                    </th>
                  )}
                  {generos.length > 0 && (
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5">
                      Género
                    </th>
                  )}
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5">
                    Precio
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5">
                    Stock
                  </th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2.5">
                    Talles
                  </th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((p) => {
                  const stock = getStockTotal(p);
                  const talles = getTalles(p);
                  const basic = isBasic(p);
                  const noStock = stock === 0 && !basic;
                  const lowStock = !basic && stock > 0 && stock <= 5;

                  return (
                    <tr
                      key={p.documentId}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {/* Nombre */}
                      <td className="px-4 py-3">
                        <span className="font-medium leading-snug">{p.nombre}</span>
                        {/* lg:hidden: muestra colegio debajo del nombre */}
                        {hasColegios && (
                          <span className="block text-xs text-muted-foreground mt-0.5 lg:hidden">
                            {p.variantesPorColegio?.map((c) => c.colegio).join(", ") ?? "—"}
                          </span>
                        )}
                      </td>

                      {/* Colegio (solo lg+) */}
                      {hasColegios && (
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground leading-relaxed">
                            {p.variantesPorColegio?.map((c) => c.colegio).join(", ") ?? "—"}
                          </span>
                        </td>
                      )}

                      {/* Género */}
                      {generos.length > 0 && (
                        <td className="px-4 py-3 text-muted-foreground">
                          {p.genero ? capitalize(p.genero) : "—"}
                        </td>
                      )}

                      {/* Precio */}
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        ${(p.precio ?? 0).toLocaleString("es-AR")}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3">
                        {basic ? (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            Básico
                          </span>
                        ) : noStock ? (
                          <span className="inline-flex items-center text-xs font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                            Sin stock
                          </span>
                        ) : (
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              lowStock ? "text-amber-600" : "text-foreground"
                            }`}
                          >
                            {stock}
                            {lowStock && (
                              <span className="text-xs font-normal text-amber-500 ml-1">bajo</span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Talles */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {talles.length > 0 ? (
                            <>
                              {talles.slice(0, 7).map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center h-5 px-1.5 rounded text-xs bg-secondary text-secondary-foreground font-medium"
                                >
                                  {t}
                                </span>
                              ))}
                              {talles.length > 7 && (
                                <span className="inline-flex items-center h-5 px-1.5 rounded text-xs border text-muted-foreground">
                                  +{talles.length - 7}
                                </span>
                              )}
                            </>
                          ) : basic ? (
                            <span className="text-xs text-muted-foreground">Sin talle</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>

                      {/* Botón */}
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          disabled={noStock}
                          onClick={() => onSelect(p)}
                          className="h-8 px-3 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:pointer-events-none"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Agregar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
