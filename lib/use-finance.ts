"use client"

import { useCallback, useEffect, useState } from "react"
import {
  DEFAULT_ENTITY,
  DEFAULT_SALDO_AWAL,
  type Liability,
  makeId,
  type Receivable,
  seedReceivables,
  seedTransactions,
  STORAGE_KEYS,
  type Transaction,
} from "@/lib/finance"

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [saldoAwal, setSaldoAwalState] = useState<number>(DEFAULT_SALDO_AWAL)
  const [saldoAwalHutang, setSaldoAwalHutangState] = useState<number>(DEFAULT_SALDO_AWAL)
  const [saldoAwalPiutang, setSaldoAwalPiutangState] = useState<number>(DEFAULT_SALDO_AWAL)
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage on mount, seeding if empty.
  useEffect(() => {
    try {
      const rawTx = localStorage.getItem(STORAGE_KEYS.transactions)
      if (rawTx) {
        // Migrate legacy records that predate entity tagging.
        const parsed: Transaction[] = JSON.parse(rawTx)
        setTransactions(parsed.map((t) => ({ ...t, entity: t.entity ?? DEFAULT_ENTITY })))
      } else {
        const seeded = seedTransactions()
        setTransactions(seeded)
        localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(seeded))
      }

      const rawSaldo = localStorage.getItem(STORAGE_KEYS.saldoAwal)
      if (rawSaldo) {
        setSaldoAwalState(Number(rawSaldo))
      } else {
        localStorage.setItem(STORAGE_KEYS.saldoAwal, String(DEFAULT_SALDO_AWAL))
      }

      const rawSaldoHutang = localStorage.getItem(STORAGE_KEYS.saldoAwalHutang)
      if (rawSaldoHutang) {
        setSaldoAwalHutangState(Number(rawSaldoHutang))
      } else {
        localStorage.setItem(STORAGE_KEYS.saldoAwalHutang, String(DEFAULT_SALDO_AWAL))
      }

      const rawSaldoPiutang = localStorage.getItem(STORAGE_KEYS.saldoAwalPiutang)
      if (rawSaldoPiutang) {
        setSaldoAwalPiutangState(Number(rawSaldoPiutang))
      } else {
        localStorage.setItem(STORAGE_KEYS.saldoAwalPiutang, String(DEFAULT_SALDO_AWAL))
      }

      // Liabilities default to an empty list for new users.
      const rawLiab = localStorage.getItem(STORAGE_KEYS.liabilities)
      if (rawLiab) {
        const parsed: Liability[] = JSON.parse(rawLiab)
        setLiabilities(parsed.map((l) => ({ ...l, entity: l.entity ?? DEFAULT_ENTITY })))
      } else {
        localStorage.setItem(STORAGE_KEYS.liabilities, JSON.stringify([]))
      }

      // Receivables (piutang) default to an empty list for new users.
      const rawRecv = localStorage.getItem(STORAGE_KEYS.receivables)
      if (rawRecv) {
        const parsed: Receivable[] = JSON.parse(rawRecv)
        setReceivables(
          parsed.map((r) => ({
            ...r,
            entity: r.entity ?? DEFAULT_ENTITY,
            status: r.status ?? "unpaid",
          })),
        )
      } else {
        localStorage.setItem(STORAGE_KEYS.receivables, JSON.stringify(seedReceivables()))
      }
    } catch (e) {
      console.log("[v0] Failed to load finance data:", e)
    } finally {
      setHydrated(true)
    }
  }, [])

  const persistLiabilities = useCallback((next: Liability[]) => {
    setLiabilities(next)
    try {
      localStorage.setItem(STORAGE_KEYS.liabilities, JSON.stringify(next))
    } catch (e) {
      console.log("[v0] Failed to persist liabilities:", e)
    }
  }, [])

  const persistReceivables = useCallback((next: Receivable[]) => {
    setReceivables(next)
    try {
      localStorage.setItem(STORAGE_KEYS.receivables, JSON.stringify(next))
    } catch (e) {
      console.log("[v0] Failed to persist receivables:", e)
    }
  }, [])

  const persistTx = useCallback((next: Transaction[]) => {
    setTransactions(next)
    try {
      localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(next))
    } catch (e) {
      console.log("[v0] Failed to persist transactions:", e)
    }
  }, [])

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id">) => {
      setTransactions((prev) => {
        const next = [{ ...tx, id: makeId() }, ...prev]
        try {
          localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(next))
        } catch (e) {
          console.log("[v0] Failed to persist transactions:", e)
        }
        return next
      })
    },
    [],
  )

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id)
      try {
        localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(next))
      } catch (e) {
        console.log("[v0] Failed to persist transactions:", e)
      }
      return next
    })
  }, [])

  const setSaldoAwal = useCallback((value: number) => {
    setSaldoAwalState(value)
    try {
      localStorage.setItem(STORAGE_KEYS.saldoAwal, String(value))
    } catch (e) {
      console.log("[v0] Failed to persist saldo awal:", e)
    }
  }, [])

  const setSaldoAwalHutang = useCallback((value: number) => {
    setSaldoAwalHutangState(value)
    try {
      localStorage.setItem(STORAGE_KEYS.saldoAwalHutang, String(value))
    } catch (e) {
      console.log("[v0] Failed to persist saldo awal hutang:", e)
    }
  }, [])

  const setSaldoAwalPiutang = useCallback((value: number) => {
    setSaldoAwalPiutangState(value)
    try {
      localStorage.setItem(STORAGE_KEYS.saldoAwalPiutang, String(value))
    } catch (e) {
      console.log("[v0] Failed to persist saldo awal piutang:", e)
    }
  }, [])

  /** Add a new loan. Optionally record the disbursed amount as a cash inflow. */
  const addLiability = useCallback(
    (liab: Omit<Liability, "id" | "createdAt">, addToCash: boolean) => {
      const entry: Liability = {
        ...liab,
        id: makeId(),
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setLiabilities((prev) => {
        const next = [entry, ...prev]
        try {
          localStorage.setItem(STORAGE_KEYS.liabilities, JSON.stringify(next))
        } catch (e) {
          console.log("[v0] Failed to persist liabilities:", e)
        }
        return next
      })
      if (addToCash && liab.principal > 0) {
        addTransaction({
          type: "income",
          title: `Pencairan Hutang: ${liab.name}`,
          amount: Math.round(liab.principal),
          category: "Lainnya",
          date: entry.createdAt,
          entity: entry.entity,
        })
      }
    },
    [addTransaction],
  )

  const deleteLiability = useCallback(
    (id: string) => {
      setLiabilities((prev) => {
        const next = prev.filter((l) => l.id !== id)
        try {
          localStorage.setItem(STORAGE_KEYS.liabilities, JSON.stringify(next))
        } catch (e) {
          console.log("[v0] Failed to persist liabilities:", e)
        }
        return next
      })
    },
    [],
  )

  /** Log an installment payment: deduct cash (expense tx) and reduce the loan principal. */
  const payLiability = useCallback(
    (id: string, amount: number, date: string) => {
      const amt = Math.max(0, Math.round(amount))
      if (amt <= 0) return
      let paidName = ""
      let paidEntity: Liability["entity"] = DEFAULT_ENTITY
      setLiabilities((prev) => {
        const next = prev.map((l) => {
          if (l.id !== id) return l
          paidName = l.name
          paidEntity = l.entity
          return {
            ...l,
            principal: Math.max(0, l.principal - amt),
            paidInstallments: (l.paidInstallments ?? 0) + 1,
          }
        })
        try {
          localStorage.setItem(STORAGE_KEYS.liabilities, JSON.stringify(next))
        } catch (e) {
          console.log("[v0] Failed to persist liabilities:", e)
        }
        return next
      })
      addTransaction({
        type: "expense",
        title: `Bayar Cicilan: ${paidName || "Hutang"}`,
        amount: amt,
        category: "Tagihan",
        date,
        entity: paidEntity,
      })
    },
    [addTransaction],
  )

  /** Record a credit / PayLater expense: it counts as spending but does not
   *  reduce cash — instead it raises a liability. When `liabilityId` matches an
   *  existing loan/card the balance is added there; otherwise a new PayLater
   *  liability is auto-created. */
  const addCreditExpense = useCallback(
    (
      tx: Omit<Transaction, "id" | "type" | "paymentMethod">,
      liabilityId: string | null,
    ) => {
      const amt = Math.max(0, Math.round(tx.amount))
      addTransaction({ ...tx, amount: amt, type: "expense", paymentMethod: "credit" })

      setLiabilities((prev) => {
        let next: Liability[]
        const existing = liabilityId ? prev.find((l) => l.id === liabilityId) : undefined
        if (existing) {
          next = prev.map((l) =>
            l.id === existing.id ? { ...l, principal: l.principal + amt } : l,
          )
        } else {
          const entry: Liability = {
            id: makeId(),
            name: `PayLater: ${tx.title}`,
            category: "PayLater",
            principal: amt,
            monthlyPayment: 0,
            dueDay: 5,
            createdAt: new Date().toISOString().slice(0, 10),
            entity: tx.entity,
          }
          next = [entry, ...prev]
        }
        try {
          localStorage.setItem(STORAGE_KEYS.liabilities, JSON.stringify(next))
        } catch (e) {
          console.log("[v0] Failed to persist liabilities:", e)
        }
        return next
      })
    },
    [addTransaction],
  )

  const addReceivable = useCallback(
    (recv: Omit<Receivable, "id">) => {
      setReceivables((prev) => {
        const next = [{ ...recv, id: makeId() }, ...prev]
        try {
          localStorage.setItem(STORAGE_KEYS.receivables, JSON.stringify(next))
        } catch (e) {
          console.log("[v0] Failed to persist receivables:", e)
        }
        return next
      })
    },
    [],
  )

  const deleteReceivable = useCallback((id: string) => {
    setReceivables((prev) => {
      const next = prev.filter((r) => r.id !== id)
      try {
        localStorage.setItem(STORAGE_KEYS.receivables, JSON.stringify(next))
      } catch (e) {
        console.log("[v0] Failed to persist receivables:", e)
      }
      return next
    })
  }, [])

  /** Mark a receivable as paid and book the collected amount as a cash inflow.
   *  The inflow is categorized "Lainnya" (not "Penjualan") so it does not double
   *  count against UMKM turnover, which already recognizes the receivable. */
  const markReceivablePaid = useCallback(
    (id: string, date: string) => {
      let paidCustomer = ""
      let paidAmount = 0
      let paidEntity: Receivable["entity"] = DEFAULT_ENTITY
      setReceivables((prev) => {
        const next = prev.map((r) => {
          if (r.id !== id || r.status === "paid") return r
          paidCustomer = r.customer
          paidAmount = r.amount
          paidEntity = r.entity
          return { ...r, status: "paid" as const, paidDate: date }
        })
        try {
          localStorage.setItem(STORAGE_KEYS.receivables, JSON.stringify(next))
        } catch (e) {
          console.log("[v0] Failed to persist receivables:", e)
        }
        return next
      })
      if (paidAmount > 0) {
        addTransaction({
          type: "income",
          title: `Pelunasan Piutang: ${paidCustomer}`,
          amount: Math.round(paidAmount),
          category: "Lainnya",
          date,
          entity: paidEntity,
        })
      }
    },
    [addTransaction],
  )

  const resetData = useCallback(() => {
    const seeded = seedTransactions()
    persistTx(seeded)
    setSaldoAwal(DEFAULT_SALDO_AWAL)
    setSaldoAwalHutang(DEFAULT_SALDO_AWAL)
    setSaldoAwalPiutang(DEFAULT_SALDO_AWAL)
    persistLiabilities([])
    persistReceivables(seedReceivables())
  }, [persistTx, setSaldoAwal, setSaldoAwalHutang, setSaldoAwalPiutang, persistLiabilities, persistReceivables])

  return {
    hydrated,
    transactions,
    saldoAwal,
    saldoAwalHutang,
    saldoAwalPiutang,
    liabilities,
    receivables,
    addTransaction,
    deleteTransaction,
    setSaldoAwal,
    setSaldoAwalHutang,
    setSaldoAwalPiutang,
    addLiability,
    deleteLiability,
    payLiability,
    addCreditExpense,
    addReceivable,
    deleteReceivable,
    markReceivablePaid,
    resetData,
  }
}
