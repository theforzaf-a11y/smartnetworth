"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import {
  DEFAULT_PASSCODE,
  MASTER_ADMIN_PASSWORD,
  MAX_SCAN_QUOTA,
  STORAGE_KEYS,
} from "@/lib/finance"

interface AccessContextValue {
  hydrated: boolean
  /** Whether the user has passed the password gate. */
  unlocked: boolean
  /** AI scans remaining for this device (0..MAX_SCAN_QUOTA). */
  scanQuota: number
  maxScanQuota: number
  /** Attempt to unlock with a passcode. Returns true on success. */
  unlock: (input: string) => boolean
  lock: () => void
  /** Consume one AI scan. Returns true if a scan was available and consumed. */
  consumeScan: () => boolean
  /** Verify the master admin password. */
  verifyMaster: (input: string) => boolean
  /** Change the password-gate passcode (takes effect immediately). */
  setPasscode: (next: string) => void
  /** Set the remaining scan quota (clamped to 0..MAX_SCAN_QUOTA). */
  setScanQuota: (next: number) => void
  /** Reset the remaining scan quota back to the maximum. */
  resetScanQuota: () => void
}

const AccessContext = createContext<AccessContextValue | null>(null)

function readPasscode(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.passcode) || DEFAULT_PASSCODE
  } catch {
    return DEFAULT_PASSCODE
  }
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [scanQuota, setScanQuotaState] = useState(MAX_SCAN_QUOTA)

  // Load persisted access state on mount.
  useEffect(() => {
    try {
      setUnlocked(localStorage.getItem(STORAGE_KEYS.unlocked) === "1")

      if (!localStorage.getItem(STORAGE_KEYS.passcode)) {
        localStorage.setItem(STORAGE_KEYS.passcode, DEFAULT_PASSCODE)
      }

      const rawQuota = localStorage.getItem(STORAGE_KEYS.scanQuota)
      if (rawQuota === null) {
        localStorage.setItem(STORAGE_KEYS.scanQuota, String(MAX_SCAN_QUOTA))
        setScanQuotaState(MAX_SCAN_QUOTA)
      } else {
        const n = Number(rawQuota)
        setScanQuotaState(Number.isFinite(n) ? Math.min(Math.max(n, 0), MAX_SCAN_QUOTA) : MAX_SCAN_QUOTA)
      }
    } catch (e) {
      console.log("[v0] Failed to load access state:", e)
    } finally {
      setHydrated(true)
    }
  }, [])

  const unlock = useCallback((input: string) => {
    if (input === readPasscode()) {
      setUnlocked(true)
      try {
        localStorage.setItem(STORAGE_KEYS.unlocked, "1")
      } catch (e) {
        console.log("[v0] Failed to persist unlocked state:", e)
      }
      return true
    }
    return false
  }, [])

  const lock = useCallback(() => {
    setUnlocked(false)
    try {
      localStorage.removeItem(STORAGE_KEYS.unlocked)
    } catch (e) {
      console.log("[v0] Failed to clear unlocked state:", e)
    }
  }, [])

  const persistQuota = useCallback((value: number) => {
    const clamped = Math.min(Math.max(Math.round(value), 0), MAX_SCAN_QUOTA)
    setScanQuotaState(clamped)
    try {
      localStorage.setItem(STORAGE_KEYS.scanQuota, String(clamped))
    } catch (e) {
      console.log("[v0] Failed to persist scan quota:", e)
    }
    return clamped
  }, [])

  const consumeScan = useCallback(() => {
    let consumed = false
    setScanQuotaState((prev) => {
      if (prev <= 0) return prev
      consumed = true
      const next = prev - 1
      try {
        localStorage.setItem(STORAGE_KEYS.scanQuota, String(next))
      } catch (e) {
        console.log("[v0] Failed to persist scan quota:", e)
      }
      return next
    })
    return consumed
  }, [])

  const verifyMaster = useCallback((input: string) => input === MASTER_ADMIN_PASSWORD, [])

  const setPasscode = useCallback((next: string) => {
    const value = next.trim()
    if (!value) return
    try {
      localStorage.setItem(STORAGE_KEYS.passcode, value)
    } catch (e) {
      console.log("[v0] Failed to persist passcode:", e)
    }
  }, [])

  const setScanQuota = useCallback(
    (next: number) => {
      persistQuota(next)
    },
    [persistQuota],
  )

  const resetScanQuota = useCallback(() => {
    persistQuota(MAX_SCAN_QUOTA)
  }, [persistQuota])

  return (
    <AccessContext.Provider
      value={{
        hydrated,
        unlocked,
        scanQuota,
        maxScanQuota: MAX_SCAN_QUOTA,
        unlock,
        lock,
        consumeScan,
        verifyMaster,
        setPasscode,
        setScanQuota,
        resetScanQuota,
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
