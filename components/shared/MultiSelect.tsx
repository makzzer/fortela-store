"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils"; // si no lo tenés, reemplazá cn(...) por las className directamente

export type Option = { label: string; value: string };

type MultiSelectProps = {
  options: Option[];
  value: string[];                       // array de values seleccionados
  onChange: (next: string[]) => void;    // callback controlado
  placeholder?: string;
  className?: string;
};

export default function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Seleccioná...",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => options.filter(o => value.includes(o.value)),
    [options, value]
  );

  const toggle = (val: string) => {
    if (value.includes(val)) onChange(value.filter(v => v !== val));
    else onChange([...value, val]);
  };

  const remove = (val: string) => onChange(value.filter(v => v !== val));
  const clearAll = () => onChange([]);

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className={selected.length ? "truncate" : "text-muted-foreground"}>
              {selected.length ? `${selected.length} seleccionado(s)` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar colegio..." />
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
            <CommandGroup className="max-h-56 overflow-auto">
              {options.map((opt) => {
                const checked = value.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => toggle(opt.value)}
                    className="flex items-center gap-2"
                  >
                    <Checkbox checked={checked} className="pointer-events-none" />
                    <span className="truncate">{opt.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Chips seleccionados */}
      <div className="mt-2 flex flex-wrap gap-2">
        {selected.map((opt) => (
          <Badge key={opt.value} variant="secondary" className="px-2 py-1">
            <span className="mr-1">{opt.label}</span>
            <button
              type="button"
              onClick={() => remove(opt.value)}
              className="inline-flex items-center opacity-60 hover:opacity-100"
              aria-label={`Quitar ${opt.label}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Badge>
        ))}
        {selected.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="h-7">
            Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
