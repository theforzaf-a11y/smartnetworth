"use client"

export type DatePreset = "hari-ini" | "7-hari" | "30-hari" | "semua" | "custom"

export interface DateRangeValue {
  from: string | null
  to: string | null
  preset: DatePreset
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: "hari-ini", label: "Hari Ini" },
  { key: "7-hari", label: "7 Hari" },
  { key: "30-hari", label: "30 Hari" },
  { key: "semua", label: "Semua" },
]

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function presetRange(preset: DatePreset): { from: string | null; to: string | null } {
  const today = new Date()
  if (preset === "hari-ini") {
    const t = toISO(today)
    return { from: t, to: t }
  }
  if (preset === "7-hari") {
    const past = new Date(today)
    past.setDate(past.getDate() - 6)
    return { from: toISO(past), to: toISO(today) }
  }
  if (preset === "30-hari") {
    const past = new Date(today)
    past.setDate(past.getDate() - 29)
    return { from: toISO(past), to: toISO(today) }
  }
  return { from: null, to: null }
}

interface DateRangeFilterProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  function selectPreset(preset: DatePreset) {
    onChange({ ...presetRange(preset), preset })
  }

  function setFrom(from: string) {
    onChange({ from: from || null, to: value.to, preset: "custom" })
  }

  function setTo(to: string) {
    onChange({ from: value.from, to: to || null, preset: "custom" })
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => selectPreset(p.key)}
            className={
              "rounded-full px-3 py-1 text-xs font-medium transition-colors " +
              (value.preset === p.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80")
            }
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value.from ?? ""}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="Dari tanggal"
          className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
        />
        <span className="shrink-0 text-xs text-muted-foreground">s/d</span>
        <input
          type="date"
          value={value.to ?? ""}
          onChange={(e) => setTo(e.target.value)}
          aria-label="Sampai tanggal"
          className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
        />
      </div>
    </div>
  )
}
