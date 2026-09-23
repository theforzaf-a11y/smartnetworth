"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

const MASTER_ADMIN_PASSWORD = "ADMIN-SMART2026"
const DEFAULT_MAX_SCAN_QUOTA = 5
const DEFAULT_MAX_VOICE_QUOTA = 3

interface Profile {
  scan_quota: number
  max_scan_quota: number
  voice_quota: number
  max_voice_quota: number
  trial_ends_at: string | null
  is_blocked: boolean
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

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("scan_quota, max_scan_quota, voice_quota, max_voice_quota, trial_ends_at, is_blocked")
      .eq("id", userId)
      .maybeSingle<Profile>()

    if (data) {
      setScanQuotaState(data.scan_quota)
      setMaxScanQuota(data.max_scan_quota)
      setVoiceQuotaState(data.voice_quota)
      setMaxVoiceQuota(data.max_voice_quota)
      setTrialEndsAt(data.trial_ends_at)
      setIsBlocked(data.is_blocked)
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
