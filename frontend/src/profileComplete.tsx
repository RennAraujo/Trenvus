import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth'

export type ProfileData = {
  fullName: string
  address: string
  termsAccepted: boolean
  completedAt: string
}

type ProfileCompleteContextValue = {
  isComplete: boolean
  profileData: ProfileData | null
  completeProfile: (data: Omit<ProfileData, 'completedAt'>) => void
}

const ProfileCompleteContext = createContext<ProfileCompleteContextValue | null>(null)

function storageKey(email: string) {
  return `trenvus.profile.${email}`
}

function loadFromStorage(email: string): ProfileData | null {
  if (!email) return null
  try {
    const raw = localStorage.getItem(storageKey(email))
    if (!raw) return null
    return JSON.parse(raw) as ProfileData
  } catch {
    return null
  }
}

export function ProfileCompleteProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const email = auth.userEmail ?? ''
  const [profileData, setProfileData] = useState<ProfileData | null>(() => loadFromStorage(email))

  useEffect(() => {
    setProfileData(loadFromStorage(email))
  }, [email])

  const isComplete = Boolean(
    profileData?.fullName?.trim() &&
    profileData?.address?.trim() &&
    profileData?.termsAccepted,
  )

  const completeProfile = useCallback(
    (data: Omit<ProfileData, 'completedAt'>) => {
      if (!email) return
      const full: ProfileData = { ...data, completedAt: new Date().toISOString() }
      localStorage.setItem(storageKey(email), JSON.stringify(full))
      setProfileData(full)
    },
    [email],
  )

  return (
    <ProfileCompleteContext.Provider value={{ isComplete, profileData, completeProfile }}>
      {children}
    </ProfileCompleteContext.Provider>
  )
}

export function useProfileComplete(): ProfileCompleteContextValue {
  const ctx = useContext(ProfileCompleteContext)
  if (!ctx) throw new Error('ProfileCompleteProvider missing')
  return ctx
}
