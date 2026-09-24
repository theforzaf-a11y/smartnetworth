"use client"

import { useMemo, useState } from "react"
import {
  HandCoins,
  Plus,
  Trash2,
  CheckCircle2,
  CalendarClock,
  Wallet,
  User,
  Briefcase,
  Home,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BreakdownRow, Card, CardTitle, StatCard } from "@/components/finance-ui"
import {
  daysUntilDate,
  ENTITY_LABEL,
  type Entity,
  formatRp,
  type Receivable,
  receivableTotals,
} from "@/lib/finance"
import { EntitySelector } from "@/components/entity-toggle"

interface SaldoAwalByEntity {
  pribadi: number
  bisnis: number
}

interface TabPiutangProps {
  receivables: Receivable[]
  saldoAwalPiutang: number
  saldoAwalPiutangByEntity: SaldoAwalByEntity
  onSaveSaldo: (entity: Entity, value: number) => void
  onAdd: (recv: Omit<Receivable, "id">) => void
  onDelete: (id: string) => void
  onMarkPaid: (id: string, date: string) => void
  defaultEntity?: Entity
}

export function TabPiutang({
  receivables,
  saldoAwalPiutang,
  saldoAwalPiutangByEntity,
  onSaveSaldo,
  onAdd,
  onDelete,
  onMarkPaid,
  defaultEntity = "pribadi",
}: TabPiutangProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingSaldo, setEditingSaldo] = useState(false)
  const totals = useMemo(() => receivableTotals(receivables), [receivables])

  // Rollover: opening balance + new receivables booked − amounts collected.
  const newPiutang = totals.active + totals.paid
  const terbayar = totals.paid
  const saldoAkhir = saldoAwalPiutang + newPiutang - terbayar

  // Outstanding first (soonest due), then settled.
  const sorted = useMemo(
    () =>
      [...receivables].sort((a, b) => {
        if (a.status !== b.status) return a.status === "unpaid" ? -1 : 1
        return a.dueDate.localeCompare(b.dueDate)
      }),
    [receivables],
  )

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Piutang Aktif"
          value={formatRp(totals.active)}
          icon={<HandCoins className="size-4" />}
          accent="sky"
          colorValue
        />
        <StatCard
          label="Jatuh Tempo Bulan Ini"
          value={formatRp(totals.dueThisMonth)}
          icon={<CalendarClock className="size-4" />}
          accent="rose"
          colorValue
        />
        <StatCard
          label="Total Piutang Terbayar"
          value={formatRp(totals.paid)}
          icon={<CheckCircle2 className="size-4" />}
          accent="emerald"
          colorValue
        />
      </div>

      {/* Rincian Saldo Akhir Piutang — explicit rollover formula */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Rincian Saldo Akhir Piutang</CardTitle>
          {!editingSaldo ? (
            <Button variant="outline" size="sm" onClick={() => setEditingSaldo(true)}>
              <Pencil className="size-3.5" />
              Ubah Saldo Awal Piutang
            </Button>
          ) : null}
        </div>
        <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
          Saldo Awal + Piutang Baru − Piutang Terbayar = Saldo Akhir
        </p>

        {editingSaldo ? (
          <SaldoAwalPiutangEditor
            byEntity={saldoAwalPiutangByEntity}
            defaultEntity={defaultEntity}
            onCancel={() => setEditingSaldo(false)}
            onSave={(entity, v) => {
              onSaveSaldo(entity, v)
              setEditingSaldo(false)
            }}
          />
        ) : null}

        <div className="mt-1 space-y-1">
          <BreakdownRow label="Saldo Awal Piutang" value={saldoAwalPiutang} />
          <BreakdownRow label="Piutang Baru Bulan Ini" value={newPiutang} op="+" tone="sky" />
          <BreakdownRow label="Piutang Terbayar" value={-terbayar} op="−" tone="default" />
          <BreakdownRow label="Saldo Akhir Piutang" value={saldoAkhir} op="=" emphasize tone="sky" />
        </div>
      </Card>

      {/* Add trigger / form */}
      {showForm ? (
        <AddReceivableForm
          defaultEntity={defaultEntity}
          onCancel={() => setShowForm(false)}
          onSubmit={(recv) => {
            onAdd(recv)
            setShowForm(false)
          }}
        />
      ) : (
        <Button size="lg" className="w-full" onClick={() => setShowForm(true)}>
          <Plus className="size-4" />
          Tambah Piutang Baru
        </Button>
      )}

      {/* Receivable list */}
      <Card>
        <CardTitle>Daftar Piutang</CardTitle>
        {receivables.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <HandCoins className="size-5" />
            </span>
            <p className="text-sm font-medium">Belum ada piutang tercatat</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Catat tagihan yang belum dibayar pelanggan atau debitur untuk memantau jatuh tempo dan
              pelunasan.
            </p>
          </div>
        ) : (
          <div className="mt-2 space-y-3">
            {sorted.map((r) => (
              <ReceivableRow key={r.id} receivable={r} onDelete={onDelete} onMarkPaid={onMarkPaid} />
            ))}
          </div>
        )}
      </Card>

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        Piutang berentitas <span className="font-semibold text-purple-600">Bisnis</span> otomatis
        dihitung sebagai omset pada tab Pajak UMKM (baik sudah lunas maupun belum). Menandai lunas
        akan mencatat pemasukan kas di Harta Lancar.
      </p>
    </div>
  )
}

function ReceivableRow({
  receivable,
  onDelete,
  onMarkPaid,
}: {
  receivable: Receivable
  onDelete: (id: string) => void
  onMarkPaid: (id: string, date: string) => void
}) {
  const paid = receivable.status === "paid"
  const days = useMemo(() => daysUntilDate(receivable.dueDate), [receivable.dueDate])

  const dueLabel = paid
    ? `Lunas ${receivable.paidDate ?? ""}`.trim()
    : days < 0
      ? `Terlambat ${Math.abs(days)} hari`
      : days === 0
        ? "Jatuh tempo hari ini"
        : `Jatuh tempo ${days} hari lagi`
  const dueClass = paid
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : days < 0
      ? "bg-destructive/10 text-destructive"
      : days < 5
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-muted text-muted-foreground"

  return (
    <div className="rounded-xl border border-border/70 p-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
          <User className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{receivable.customer}</p>
              <p className="text-xs text-muted-foreground">Transaksi {receivable.date}</p>
            </div>
            <div className="shrink-0 text-right">
              <p
                className={
                  "text-sm font-bold " +
                  (paid ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400")
                }
              >
                {formatRp(receivable.amount)}
              </p>
              <p className="text-[11px] text-muted-foreground">nominal</p>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
              {receivable.entity === "bisnis" ? (
                <Briefcase className="size-3" />
              ) : (
                <Home className="size-3" />
              )}
              {ENTITY_LABEL[receivable.entity]}
            </span>
            <span
              className={
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold " +
                dueClass
              }
            >
              {paid ? <CheckCircle2 className="size-3" /> : <CalendarClock className="size-3" />}
              {dueLabel}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={paid}
              onClick={() => onMarkPaid(receivable.id, new Date().toISOString().slice(0, 10))}
            >
              <Wallet className="size-3.5" />
              {paid ? "Sudah Lunas" : "Tandai Lunas"}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus piutang ${receivable.customer}`}
              onClick={() => {
                if (confirm(`Hapus piutang "${receivable.customer}"?`)) onDelete(receivable.id)
              }}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddReceivableForm({
  onSubmit,
  onCancel,
  defaultEntity = "pribadi",
}: {
  onSubmit: (recv: Omit<Receivable, "id">) => void
  onCancel: () => void
  defaultEntity?: Entity
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [customer, setCustomer] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(today)
  const [dueDate, setDueDate] = useState(today)
  const [entity, setEntity] = useState<Entity>(defaultEntity)
  const [status, setStatus] = useState<Receivable["status"]>("unpaid")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!customer.trim() || !amt || amt <= 0) return
    onSubmit({
      customer: customer.trim(),
      amount: Math.round(amt),
      date,
      dueDate,
      entity,
      status,
      ...(status === "paid" ? { paidDate: today } : {}),
    })
  }

  return (
    <Card>
      <CardTitle>Tambah Piutang Baru</CardTitle>
      <form onSubmit={handleSubmit} className="mt-3 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Entitas</label>
          <EntitySelector value={entity} onChange={setEntity} />
        </div>

        <div>
          <label htmlFor="recv-customer" className="mb-1.5 block text-sm font-medium">
            Nama Pelanggan / Debitur
          </label>
          <input
            id="recv-customer"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="cth. Toko Makmur Jaya"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label htmlFor="recv-amount" className="mb-1.5 block text-sm font-medium">
            Nominal (Rp)
          </label>
          <input
            id="recv-amount"
            type="number"
            inputMode="numeric"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={inputClass}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="recv-date" className="mb-1.5 block text-sm font-medium">
              Tanggal Transaksi
            </label>
            <input
              id="recv-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="recv-due" className="mb-1.5 block text-sm font-medium">
              Tanggal Jatuh Tempo
            </label>
            <input
              id="recv-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="recv-status" className="mb-1.5 block text-sm font-medium">
            Status
          </label>
          <select
            id="recv-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Receivable["status"])}
            className={inputClass}
          >
            <option value="unpaid">Belum Lunas</option>
            <option value="paid">Lunas</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit" size="lg" className="flex-1">
            <Plus className="size-4" />
            Simpan Piutang
          </Button>
        </div>
      </form>
    </Card>
  )
}

function SaldoAwalPiutangEditor({
  byEntity,
  defaultEntity,
  onSave,
  onCancel,
}: {
  byEntity: SaldoAwalByEntity
  defaultEntity: Entity
  onSave: (entity: Entity, value: number) => void
  onCancel: () => void
}) {
  const [entity, setEntity] = useState<Entity>(defaultEntity)
  const [value, setValue] = useState(String(byEntity[defaultEntity] || ""))

  function handleEntityChange(next: Entity) {
    setEntity(next)
    setValue(String(byEntity[next] || ""))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave(entity, Math.max(0, Math.round(Number(value) || 0)))
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-3 rounded-lg border border-border/70 bg-muted/40 p-3"
    >
      <label className="mb-1.5 block text-sm font-medium">Entitas</label>
      <EntitySelector value={entity} onChange={handleEntityChange} />

      <label htmlFor="saldo-awal-piutang" className="mb-1.5 mt-3 block text-sm font-medium">
        Saldo Awal Piutang — {ENTITY_LABEL[entity]} (Rp)
      </label>
      <input
        id="saldo-awal-piutang"
        type="number"
        inputMode="numeric"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0"
        className={inputClass}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        Titik awal saldo piutang {ENTITY_LABEL[entity].toLowerCase()} sebelum transaksi periode ini
        dihitung.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit" size="sm" className="flex-1">
          Simpan Saldo Awal
        </Button>
      </div>
    </form>
  )
}

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/40"
