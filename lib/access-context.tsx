"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { MASTER_ADMIN_PASSWORD, MAX_SCAN_QUOTA, MAX_VOICE_QUOTA } from "@/lib/finance"

interface Profile {
  scan_quota: number
  max_scan_quota: number
  voice_quota: number
  max_voice_quota: number
}

interface AccessContextValue {
  hydrated: boolean
  unlocked: boolean
  user: User | null
  scanQuota: number
  maxScanQuota: number
  voiceQuota: number
  maxVoiceQuota: number
  lock: () => void
  consumeScan: () => boolean
  consumeVoice: () => boolean
  verifyMaster: (input: string) => boolean
  setScanQuota: (next: number) => void
  resetScanQuota: () => void
  setVoiceQuota: (next: number) => void
  resetVoiceQuota: () => void
}

const AccessContext = createContext<AccessContextValue | null>(null)

const DEFAULT_PROFILE: Profile = {
  scan_quota: MAX_SCAN_QUOTA,
  max_scan_quota: MAX_SCAN_QUOTA,
  voice_quota: MAX_VOICE_QUOTA,
  max_voice_quota: MAX_VOICE_QUOTA,
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("scan_quota, max_scan_quota, voice_quota, max_voice_quota")
      .eq("id", userId)
      .single()
    if (data) setProfile(data as Profile)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const sessionUser = data.session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) loadProfile(sessionUser.id)
      setHydrated(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        loadProfile(sessionUser.id)
      } else {
        setProfile(DEFAULT_PROFILE)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [loadProfile])

  const lock = useCallback(() => {
    supabase.auth.signOut()
  }, [])

  const consumeScan = useCallback(() => {
    if (!user) return false
    let consumed = false
    setProfile((prev) => {
      if (prev.scan_quota <= 0) return prev
      consumed = true
      const next = prev.scan_quota - 1
      supabase.from("profiles").update({ scan_quota: next }).eq("id", user.id).then()
      return { ...prev, scan_quota: next }
    })
    return consumed
  }, [user])

  const consumeVoice = useCallback(() => {
    if (!user) return false
    let consumed = false
    setProfile((prev) => {
      if (prev.voice_quota <= 0) return prev
      consumed = true
      const next = prev.voice_quota - 1
      supabase.from("profiles").update({ voice_quota: next }).eq("id", user.id).then()
      return { ...prev, voice_quota: next }
    })
    return consumed
  }, [user])

  const verifyMaster = useCallback((input: string) => input === MASTER_ADMIN_PASSWORD, [])

  const setScanQuota = useCallback(
    (next: number) => {
      if (!user) return
      const clamped = Math.min(Math.max(Math.round(next), 0), profile.max_scan_quota)
      setProfile((prev) => ({ ...prev, scan_quota: clamped }))
      supabase.from("profiles").update({ scan_quota: clamped }).eq("id", user.id).then()
    },
    [user, profile.max_scan_quota],
  )

  const resetScanQuota = useCallback(() => {
    setScanQuota(profile.max_scan_quota)
  }, [setScanQuota, profile.max_scan_quota])

  const setVoiceQuota = useCallback(
    (next: number) => {
      if (!user) return
      const clamped = Math.min(Math.max(Math.round(next), 0), profile.max_voice_quota)
      setProfile((prev) => ({ ...prev, voice_quota: clamped }))
      supabase.from("profiles").update({ voice_quota: clamped }).eq("id", user.id).then()
    },
    [user, profile.max_voice_quota],
  )

  const resetVoiceQuota = useCallback(() => {
    setVoiceQuota(profile.max_voice_quota)
  }, [setVoiceQuota, profile.max_voice_quota])

  return (
    <AccessContext.Provider
      value={{
        hydrated,
        unlocked: !!user,
        user,
        scanQuota: profile.scan_quota,
        maxScanQuota: profile.max_scan_quota,
        voiceQuota: profile.voice_quota,
        maxVoiceQuota: profile.max_voice_quota,
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
  if (!ctx) throw new Error("useAccess must be used within an AccessProvider")
  return ctx
}
