"use client"

import { useMemo, useState } from "react"
import { Coins, Pencil, Check, Wallet } from "lucide-react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Button } from "@/components/ui/button"
import { BreakdownRow, Card, CardTitle, CHART_COLORS } from "@/components/finance-ui"
import {
  assetDistribution,
  ENTITY_LABEL,
  type Entity,
  formatRp,
  netCashflow,
  totalAssetTransfers,
  totalLiquidAssets,
  type Transaction,
} from "@/lib/finance"
import { EntitySelector } from "@/components/entity-toggle"

interface SaldoAwalByEntity {
  pribadi: number
  bisnis: number
}

interface TabHartaProps {
  transactions: Transaction[]
  saldoAwal: number
  saldoAwalByEntity: SaldoAwalByEntity
  onSaveSaldo: (entity: Entity, value: number) => void
  defaultEntity?: Entity
}

export function TabHarta({
  transactions,
  saldoAwal,
  saldoAwalByEntity,
  onSaveSaldo,
  defaultEntity = "pribadi",
}: TabHartaProps) {
  const [editing, setEditing] = useState(false)
  const [entity, setEntity] = useState<Entity>(defaultEntity)
  const [draft, setDraft] = useState(String(saldoAwalByEntity[defaultEntity] || ""))

  const total = useMemo(
    () => totalLiquidAssets(transactions, saldoAwal),
    [transactions, saldoAwal],
  )
  const transfers = useMemo(() => totalAssetTransfers(transactions), [transactions])
  const arusKas = useMemo(() => netCashflow(transactions), [transactions])
  const dist = useMemo(
    () => assetDistribution(transactions, saldoAwal),
    [transactions, saldoAwal],
  )

  function startEditing() {
    setEntity(defaultEntity)
    setDraft(String(saldoAwalByEntity[defaultEntity] || ""))
    setEditing(true)
  }

  function handleEntityChange(next: Entity) {
    setEntity(next)
    setDraft(String(saldoAwalByEntity[next] || ""))
  }

  function commit() {
    const v = Math.max(0, Math.round(Number(draft) || 0))
    onSaveSaldo(entity, v)
    setEditing(false)
  }

  return (
    <div className="space-y-5">
      {/* Total banner */}
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="flex items-center gap-2 text-violet-700">
          <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
            <Wallet className="size-4" />
          </span>
          <span className="text-sm font-medium">Saldo Akhir Harta / Kas</span>
        </div>
        <p className="mt-2 text-3xl font-bold tracking-tight text-violet-700 sm:text-4xl">
          {formatRp(total)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <BannerStat label="Saldo Awal" value={formatRp(saldoAwal)} />
          <BannerStat label="Transfer Aset" value={formatRp(transfers)} />
        </div>
      </Card>

      {/* Rollover breakdown: Saldo Awal + Transfer/Investasi + Arus Kas Bersih = Saldo Akhir */}
      <Card>
        <CardTitle>Rincian Saldo Akhir Harta</CardTitle>
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">
          Saldo awal + transfer/investasi + arus kas bersih
        </p>
        <div className="space-y-1">
          <BreakdownRow label="Saldo Awal Harta" value={saldoAwal} />
          <BreakdownRow label="Transfer / Investasi" value={transfers} op="+" />
          <BreakdownRow label="Arus Kas Bersih" value={arusKas} op="+" signed />
          <div className="my-1 border-t border-dashed border-border" />
          <BreakdownRow label="Saldo Akhir Harta" value={total} op="=" emphasize tone="violet" />
        </div>
      </Card>

      {/* Editable saldo awal */}
      <Card>
        <CardTitle>Saldo Awal Harta / Kas Bulan Lalu</CardTitle>

        {editing ? (
          <div className="mt-3 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Entitas</label>
              <EntitySelector value={entity} onChange={handleEntityChange} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Saldo Awal Harta — {ENTITY_LABEL[entity]} (Rp)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) commit()
                    }}
                    className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <Button size="lg" onClick={commit}>
                  <Check className="size-4" />
                  Simpan
                </Button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
              Batal
            </Button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <p className="flex-1 text-2xl font-bold">{formatRp(saldoAwal)}</p>
            <Button variant="outline" size="lg" onClick={startEditing}>
              <Pencil className="size-4" />
              Ubah
            </Button>
          </div>
        )}
      </Card>

      {/* Donut chart */}
      <Card>
        <CardTitle>Distribusi Harta Lancar</CardTitle>
        {dist.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data harta.</p>
        ) : (
          <div className="mt-2 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dist}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {dist.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => formatRp(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-2 space-y-1.5">
          {dist.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                {s.name}
              </span>
              <span className="font-semibold">{formatRp(s.value)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function BannerStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-violet-100 bg-white/70 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold text-foreground">{value}</p>
    </div>
  )
}
