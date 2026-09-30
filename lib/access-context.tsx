"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

const MASTER_ADMIN_PASSWORD = "ADMIN-SMART2026"
const DEFAULT_MAX_SCAN_QUOTA = 5
const DEFAULT_MAX_VOICE_QUOTA = 3
const DEFAULT_EDIT_PIN = "EDIT1234"
const EDIT_UNLOCK_STORAGE_KEY = "sn_edit_unlocked"

interface Profile {
  scan_quota: number
  max_scan_quota: number
  voice_quota: number
  max_voice_quota: number
  trial_ends_at: string | null
  is_blocked: boolean
  edit_pin: string | null
}

interface AccessContextValue {
  hydrated: boolean
  unlocked: boolean
  user: User | null
  scanQuota: number
  maxScanQuota: number
  voiceQuota: number
  maxVoiceQuota: number
  trialEndsAt: string | null
  isBlocked: boolean
  trialExpired: boolean
  lock: () => void
  consumeScan: () => boolean
  consumeVoice: () => boolean
  verifyMaster: (password: string) => boolean
  setScanQuota: (value: number) => void
  resetScanQuota: () => void
  setVoiceQuota: (value: number) => void
  resetVoiceQuota: () => void
  /** Mode Edit: default terkunci (Lihat Saja) di setiap device sampai PIN Edit dimasukkan. */
  canEdit: boolean
  editPin: string
  unlockEdit: (pin: string) => boolean
  lockEdit: () => void
  setEditPin: (newPin: string) => void
}

const AccessContext = createContext<AccessContextValue | null>(null)

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [scanQuota, setScanQuotaState] = useState(DEFAULT_MAX_SCAN_QUOTA)
  const [maxScanQuota, setMaxScanQuota] = useState(DEFAULT_MAX_SCAN_QUOTA)
  const [voiceQuota, setVoiceQuotaState] = useState(DEFAULT_MAX_VOICE_QUOTA)
  const [maxVoiceQuota, setMaxVoiceQuota] = useState(DEFAULT_MAX_VOICE_QUOTA)
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [isBlocked, setIsBlocked] = useState(false)
  const [editPin, setEditPinState] = useState(DEFAULT_EDIT_PIN)
  const [canEdit, setCanEdit] = useState(false)

  // Mode Edit tersimpan per-device (localStorage) — default selalu terkunci di device baru.
  useEffect(() => {
    try {
      setCanEdit(window.localStorage.getItem(EDIT_UNLOCK_STORAGE_KEY) === "1")
    } catch {
      // localStorage tidak tersedia — biarkan default terkunci.
    }
  }, [])

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select(
        "scan_quota, max_scan_quota, voice_quota, max_voice_quota, trial_ends_at, is_blocked, edit_pin",
      )
      .eq("id", userId)
      .maybeSingle<Profile>()

    if (data) {
      setScanQuotaState(data.scan_quota)
      setMaxScanQuota(data.max_scan_quota)
      setVoiceQuotaState(data.voice_quota)
      setMaxVoiceQuota(data.max_voice_quota)
      setTrialEndsAt(data.trial_ends_at)
      setIsBlocked(data.is_blocked)
      setEditPinState(data.edit_pin ?? DEFAULT_EDIT_PIN)
    }
  }, [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        loadProfile(sessionUser.id).finally(() => setHydrated(true))
      } else {
        setHydrated(true)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        loadProfile(sessionUser.id)
      }
      setHydrated(true)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const lock = useCallback(() => {
    supabase.auth.signOut()
  }, [])

  const consumeScan = useCallback(() => {
    if (scanQuota <= 0) return false
    const next = scanQuota - 1
    setScanQuotaState(next)
    if (user) {
      supabase.from("profiles").update({ scan_quota: next }).eq("id", user.id).then()
    }
    return true
  }, [scanQuota, user])

  const consumeVoice = useCallback(() => {
    if (voiceQuota <= 0) return false
    const next = voiceQuota - 1
    setVoiceQuotaState(next)
    if (user) {
      supabase.from("profiles").update({ voice_quota: next }).eq("id", user.id).then()
    }
    return true
  }, [voiceQuota, user])

  const verifyMaster = useCallback((password: string) => {
    return password === MASTER_ADMIN_PASSWORD
  }, [])

  const setScanQuota = useCallback(
    (value: number) => {
      setScanQuotaState(value)
      if (user) {
        supabase.from("profiles").update({ scan_quota: value }).eq("id", user.id).then()
      }
    },
    [user],
  )

  const resetScanQuota = useCallback(() => {
    setScanQuotaState(maxScanQuota)
    if (user) {
      supabase.from("profiles").update({ scan_quota: maxScanQuota }).eq("id", user.id).then()
    }
  }, [maxScanQuota, user])

  const setVoiceQuota = useCallback(
    (value: number) => {
      setVoiceQuotaState(value)
      if (user) {
        supabase.from("profiles").update({ voice_quota: value }).eq("id", user.id).then()
      }
    },
    [user],
  )

  const resetVoiceQuota = useCallback(() => {
    setVoiceQuotaState(maxVoiceQuota)
    if (user) {
      supabase.from("profiles").update({ voice_quota: maxVoiceQuota }).eq("id", user.id).then()
    }
  }, [maxVoiceQuota, user])

  const unlockEdit = useCallback(
    (pin: string) => {
      if (pin !== editPin) return false
      setCanEdit(true)
      try {
        window.localStorage.setItem(EDIT_UNLOCK_STORAGE_KEY, "1")
      } catch {
        // abaikan bila localStorage tidak tersedia
      }
      return true
    },
    [editPin],
  )

  const lockEdit = useCallback(() => {
    setCanEdit(false)
    try {
      window.localStorage.removeItem(EDIT_UNLOCK_STORAGE_KEY)
    } catch {
      // abaikan bila localStorage tidak tersedia
    }
  }, [])

  const setEditPin = useCallback(
    (newPin: string) => {
      setEditPinState(newPin)
      if (user) {
        supabase.from("profiles").update({ edit_pin: newPin }).eq("id", user.id).then()
      }
    },
    [user],
  )

  const trialExpired =
    isBlocked || (trialEndsAt !== null && new Date(trialEndsAt).getTime() < Date.now())

  return (
    <AccessContext.Provider
      value={{
        hydrated,
        unlocked: !!user,
        user,
        scanQuota,
        maxScanQuota,
        voiceQuota,
        maxVoiceQuota,
        trialEndsAt,
        isBlocked,
        trialExpired,
        lock,
        consumeScan,
        consumeVoice,
        verifyMaster,
        setScanQuota,
        resetScanQuota,
        setVoiceQuota,
        resetVoiceQuota,
        canEdit,
        editPin,
        unlockEdit,
        lockEdit,
        setEditPin,
      }}
    >
      {children}
    </AccessContext.Provider>
  )
}

export function useAccess() {
  const ctx = useContext(AccessContext)
  if (!ctx) throw new Error("useAccess must be used within AccessProvider")
  return ctx
}
