"use client"

import { Home, Briefcase, LayoutGrid } from "lucide-react"
import type { Entity, EntityFilter } from "@/lib/finance"

/** Shared active-state accents. Pribadi = calm emerald, Bisnis = professional purple. */
const ACTIVE_CLASS: Record<EntityFilter, string> = {
  semua: "bg-background text-foreground shadow-sm ring-1 ring-inset ring-border",
  pribadi: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30",
  bisnis: "bg-purple-600 text-white shadow-sm shadow-purple-600/30",
}

const INACTIVE_CLASS = "text-muted-foreground hover:text-foreground"

function pill(active: boolean, key: EntityFilter) {
  return [
    "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all sm:text-sm",
    active ? ACTIVE_CLASS[key] : INACTIVE_CLASS,
  ].join(" ")
}

/** 3-option filter: Semua | Pribadi | Bisnis. Used for viewing/filtering pages. */
export function EntityFilterToggle({
  value,
  onChange,
  className = "",
}: {
  value: EntityFilter
  onChange: (v: EntityFilter) => void
  className?: string
}) {
  const options: { key: EntityFilter; label: string; icon: typeof Home }[] = [
    { key: "semua", label: "Semua", icon: LayoutGrid },
    { key: "pribadi", label: "Pribadi", icon: Home },
    { key: "bisnis", label: "Bisnis", icon: Briefcase },
  ]
  return (
    <div
      role="tablist"
      aria-label="Filter entitas keuangan"
      className={"flex items-center gap-1 rounded-xl bg-muted p-1 " + className}
    >
      {options.map(({ key, label, icon: Icon }) => {
        const active = value === key
        return (
          <button
            key={key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(key)}
            className={pill(active, key)}
          >
            <Icon className="size-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/** 2-option selector: Pribadi | Bisnis. Used inside data-entry forms. */
export function EntitySelector({
  value,
  onChange,
  className = "",
}: {
  value: Entity
  onChange: (v: Entity) => void
  className?: string
}) {
  const options: { key: Entity; label: string; icon: typeof Home }[] = [
    { key: "pribadi", label: "Pribadi", icon: Home },
    { key: "bisnis", label: "Bisnis", icon: Briefcase },
  ]
  return (
    <div
      role="radiogroup"
      aria-label="Pilih entitas transaksi"
      className={"flex items-center gap-1 rounded-xl bg-muted p-1 " + className}
    >
      {options.map(({ key, label, icon: Icon }) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={pill(active, key)}
          >
            <Icon className="size-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
