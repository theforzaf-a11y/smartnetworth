import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn("text-sm font-semibold text-muted-foreground", className)}>{children}</h3>
  )
}

export function StatCard({
  label,
  value,
  icon,
  accent = "default",
  colorValue = false,
  subtitle,
}: {
  label: string
  value: string
  icon: ReactNode
  accent?: "default" | "emerald" | "rose" | "sky" | "blue" | "indigo"
  colorValue?: boolean
  subtitle?: string
}) {
  const accents: Record<string, string> = {
    default: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    indigo: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  }
  const valueColors: Record<string, string> = {
    default: "text-foreground",
    emerald: "text-emerald-600 dark:text-emerald-400",
    rose: "text-rose-600 dark:text-rose-400",
    sky: "text-sky-600 dark:text-sky-400",
    blue: "text-blue-600 dark:text-blue-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", accents[accent])}>
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-xl font-bold tracking-tight sm:text-2xl",
          colorValue ? valueColors[accent] : "text-foreground",
        )}
      >
        {value}
      </p>
      {subtitle ? <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}

const RP = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 })

/** A single line in a rollover breakdown, e.g. "+ Transfer / Investasi ... Rp 500.000".
 *  Set `emphasize` for the result row and `tone` to color its amount. */
export function BreakdownRow({
  label,
  value,
  op,
  signed = false,
  emphasize = false,
  tone = "default",
}: {
  label: string
  value: number
  op?: "+" | "−" | "="
  /** Show an explicit +/− sign on the amount based on its own value. */
  signed?: boolean
  emphasize?: boolean
  tone?: "default" | "violet" | "rose" | "sky"
}) {
  const toneClass: Record<string, string> = {
    default: "text-foreground",
    violet: "text-violet-700 dark:text-violet-400",
    rose: "text-rose-600 dark:text-rose-400",
    sky: "text-sky-600 dark:text-sky-400",
  }
  const sign = value < 0 ? "-" : signed ? "+" : ""
  const amount = "Rp " + RP.format(Math.abs(Math.round(value)))
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg px-3 py-2",
        emphasize ? "bg-muted/60" : "",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {op ? (
          <span className="inline-flex w-4 shrink-0 justify-center text-sm font-semibold text-muted-foreground">
            {op}
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className={cn("truncate text-sm", emphasize ? "font-semibold" : "text-muted-foreground")}>
          {label}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 tabular-nums",
          emphasize ? "text-base font-bold" : "text-sm font-medium",
          toneClass[tone],
        )}
      >
        {sign}
        {amount}
      </span>
    </div>
  )
}

const PALETTE = [
  "var(--color-chart-1, #6366f1)",
  "var(--color-chart-2, #10b981)",
  "var(--color-chart-3, #f59e0b)",
  "var(--color-chart-4, #ef4444)",
  "var(--color-chart-5, #0ea5e9)",
]

export const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#0ea5e9", "#a855f7"]

export { PALETTE }
