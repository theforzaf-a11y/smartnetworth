"use client"

import { useCallback, useEffect, useState } from "react"
import { DEFAULT_SALDO_AWAL, type Liability, type Receivable, type Transaction } from "@/lib/finance"
import { supabase } from "@/lib/supabase"

function newId() {
  return crypto.randomUUID()
}

function rowToTransaction(r: any): Transaction {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    amount: Number(r.amount),
    category: r.category,
    date: r.date,
    entity: r.entity,
    paymentMethod: r.payment_method ?? undefined,
  }
}

function rowToLiability(r: any): Liability {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    principal: Number(r.principal),
    monthlyPayment: Number(r.monthly_payment),
    dueDay: r.due_day,
    createdAt: r.created_date,
    entity: r.entity,
    tenorMonths: r.tenor_months ?? undefined,
    paidInstallments: r.paid_installments ?? undefined,
  }
}

function rowToReceivable(r: any): Receivable {
  return {
    id: r.id,
    customer: r.customer,
    amount: Number(r.amount),
    date: r.date,
    dueDate: r.due_date,
    entity: r.entity,
    status: r.status,
    paidDate: r.paid_date ?? undefined,
  }
}

export function useFinance() {
  const [userId, setUserId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [saldoAwal, setSaldoAwalState] = useState<number>(DEFAULT_SALDO_AWAL)
  const [saldoAwalHutang, setSaldoAwalHutangState] = useState<number>(DEFAULT_SALDO_AWAL)
  const [saldoAwalPiutang, setSaldoAwalPiutangState] = useState<number>(DEFAULT_SALDO_AWAL)
  const [liabilities, setLiabilities] = useState<Liability[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    let active = true

    async function loadAll(uid: string) {
      const [txRes, liabRes, recvRes, profileRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", uid).order("date", { ascending: false }),
        supabase.from("liabilities").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
        supabase.from("receivables").select("*").eq("user_id", uid).order("date", { ascending: false }),
        supabase
          .from("profiles")
          .select("saldo_awal, saldo_awal_hutang, saldo_awal_piutang")
          .eq("id", uid)
          .maybeSingle(),
      ])
      if (!active) return
      setTransactions((txRes.data ?? []).map(rowToTransaction))
      setLiabilities((liabRes.data ?? []).map(rowToLiability))
      setReceivables((recvRes.data ?? []).map(rowToReceivable))
      if (profileRes.data) {
        setSaldoAwalState(Number(profileRes.data.saldo_awal ?? 0))
        setSaldoAwalHutangState(Number(profileRes.data.saldo_awal_hutang ?? 0))
        setSaldoAwalPiutangState(Number(profileRes.data.saldo_awal_piutang ?? 0))
      }
      setHydrated(true)
    }

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        loadAll(uid)
      } else {
        setHydrated(true)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        loadAll(uid)
      } else {
        setTransactions([])
        setLiabilities([])
        setReceivables([])
        setSaldoAwalState(DEFAULT_SALDO_AWAL)
        setSaldoAwalHutangState(DEFAULT_SALDO_AWAL)
        setSaldoAwalPiutangState(DEFAULT_SALDO_AWAL)
        setHydrated(true)
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const addTransaction = useCallback(
    (tx: Omit<Transaction, "id">) => {
      const id = newId()
      const entry: Transaction = { ...tx, id }
      setTransactions((prev) => [entry, ...prev])
      if (userId) {
        supabase
          .from("transactions")
          .insert({
            id,
            user_id: userId,
            type: tx.type,
            title: tx.title,
            amount: tx.amount,
            category: tx.category,
            date: tx.date,
            entity: tx.entity,
            payment_method: tx.paymentMethod ?? null,
          })
          .then()
      }
    },
    [userId],
  )

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      if (userId) {
        supabase.from("transactions").delete().eq("id", id).eq("user_id", userId).then()
      }
    },
    [userId],
  )

  const setSaldoAwal = useCallback(
    (value: number) => {
      setSaldoAwalState(value)
      if (userId) {
        supabase.from("profiles").update({ saldo_awal: value }).eq("id", userId).then()
      }
    },
    [userId],
  )

  const setSaldoAwalHutang = useCallback(
    (value: number) => {
      setSaldoAwalHutangState(value)
      if (userId) {
        supabase.from("profiles").update({ saldo_awal_hutang: value }).eq("id", userId).then()
      }
    },
    [userId],
  )

  const setSaldoAwalPiutang = useCallback(
    (value: number) => {
      setSaldoAwalPiutangState(value)
      if (userId) {
        supabase.from("profiles").update({ saldo_awal_piutang: value }).eq("id", userId).then()
      }
    },
    [userId],
  )

  const addLiability = useCallback(
    (liab: Omit<Liability, "id" | "createdAt">, addToCash: boolean) => {
      const id = newId()
      const createdAt = new Date().toISOString().slice(0, 10)
      const entry: Liability = { ...liab, id, createdAt }
      setLiabilities((prev) => [entry, ...prev])
      if (userId) {
        supabase
          .from("liabilities")
          .insert({
            id,
            user_id: userId,
            name: liab.name,
            category: liab.category,
            principal: liab.principal,
            monthly_payment: liab.monthlyPayment,
            due_day: liab.dueDay,
            entity: liab.entity,
            tenor_months: liab.tenorMonths ?? null,
            paid_installments: liab.paidInstallments ?? 0,
            created_date: createdAt,
          })
          .then()
      }
      if (addToCash && liab.principal > 0) {
        addTransaction({
          type: "income",
          title: `Pencairan Hutang: ${liab.name}`,
          amount: Math.round(liab.principal),
          category: "Lainnya",
          date: createdAt,
          entity: entry.entity,
        })
      }
    },
    [userId, addTransaction],
  )

  const deleteLiability = useCallback(
    (id: string) => {
      setLiabilities((prev) => prev.filter((l) => l.id !== id))
      if (userId) {
        supabase.from("liabilities").delete().eq("id", id).eq("user_id", userId).then()
      }
    },
    [userId],
  )

  const payLiability = useCallback(
    (id: string, amount: number, date: string) => {
      const amt = Math.max(0, Math.round(amount))
      if (amt <= 0) return
      let paidName = ""
      let paidEntity: Liability["entity"] = "pribadi"
      let newPrincipal = 0
      let newPaidInstallments = 0
      setLiabilities((prev) =>
        prev.map((l) => {
          if (l.id !== id) return l
          paidName = l.name
          paidEntity = l.entity
          newPrincipal = Math.max(0, l.principal - amt)
          newPaidInstallments = (l.paidInstallments ?? 0) + 1
          return { ...l, principal: newPrincipal, paidInstallments: newPaidInstallments }
        }),
      )
      if (userId) {
        supabase
          .from("liabilities")
          .update({ principal: newPrincipal, paid_installments: newPaidInstallments })
          .eq("id", id)
          .eq("user_id", userId)
          .then()
      }
      addTransaction({
        type: "expense",
        title: `Bayar Cicilan: ${paidName || "Hutang"}`,
        amount: amt,
        category: "Tagihan",
        date,
        entity: paidEntity,
      })
    },
    [userId, addTransaction],
  )

  const addCreditExpense = useCallback(
    (tx: Omit<Transaction, "id" | "type" | "paymentMethod">, liabilityId: string | null) => {
      const amt = Math.max(0, Math.round(tx.amount))
      addTransaction({ ...tx, amount: amt, type: "expense", paymentMethod: "credit" })

      setLiabilities((prev) => {
        const existing = liabilityId ? prev.find((l) => l.id === liabilityId) : undefined
        if (existing) {
          const newPrincipal = existing.principal + amt
          if (userId) {
            supabase
              .from("liabilities")
              .update({ principal: newPrincipal })
              .eq("id", existing.id)
              .eq("user_id", userId)
              .then()
          }
          return prev.map((l) => (l.id === existing.id ? { ...l, principal: newPrincipal } : l))
        }
        const id = newId()
        const createdAt = new Date().toISOString().slice(0, 10)
        const entry: Liability = {
          id,
          name: `PayLater: ${tx.title}`,
          category: "PayLater",
          principal: amt,
          monthlyPayment: 0,
          dueDay: 5,
          createdAt,
          entity: tx.entity,
        }
        if (userId) {
          supabase
            .from("liabilities")
            .insert({
              id,
              user_id: userId,
              name: entry.name,
              category: entry.category,
              principal: entry.principal,
              monthly_payment: entry.monthlyPayment,
              due_day: entry.dueDay,
              entity: entry.entity,
              created_date: createdAt,
              paid_installments: 0,
            })
            .then()
        }
        return [entry, ...prev]
      })
    },
    [userId, addTransaction],
  )

  const addReceivable = useCallback(
    (recv: Omit<Receivable, "id">) => {
      const id = newId()
      const entry: Receivable = { ...recv, id }
      setReceivables((prev) => [entry, ...prev])
      if (userId) {
        supabase
          .from("receivables")
          .insert({
            id,
            user_id: userId,
            customer: recv.customer,
            amount: recv.amount,
            date: recv.date,
            due_date: recv.dueDate,
            entity: recv.entity,
            status: recv.status,
            paid_date: recv.paidDate ?? null,
          })
          .then()
      }
    },
    [userId],
  )

  const deleteReceivable = useCallback(
    (id: string) => {
      setReceivables((prev) => prev.filter((r) => r.id !== id))
      if (userId) {
        supabase.from("receivables").delete().eq("id", id).eq("user_id", userId).then()
      }
    },
    [userId],
  )

  const markReceivablePaid = useCallback(
    (id: string, date: string) => {
      let paidCustomer = ""
      let paidAmount = 0
      let paidEntity: Receivable["entity"] = "pribadi"
      setReceivables((prev) =>
        prev.map((r) => {
          if (r.id !== id || r.status === "paid") return r
          paidCustomer = r.customer
          paidAmount = r.amount
          paidEntity = r.entity
          return { ...r, status: "paid" as const, paidDate: date }
        }),
      )
      if (userId) {
        supabase
          .from("receivables")
          .update({ status: "paid", paid_date: date })
          .eq("id", id)
          .eq("user_id", userId)
          .then()
      }
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
    [userId, addTransaction],
  )

  const resetData = useCallback(() => {
    setTransactions([])
    setLiabilities([])
    setReceivables([])
    setSaldoAwal(0)
    setSaldoAwalHutang(0)
    setSaldoAwalPiutang(0)
    if (userId) {
      supabase.from("transactions").delete().eq("user_id", userId).then()
      supabase.from("liabilities").delete().eq("user_id", userId).then()
      supabase.from("receivables").delete().eq("user_id", userId).then()
    }
  }, [userId, setSaldoAwal, setSaldoAwalHutang, setSaldoAwalPiutang])

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
