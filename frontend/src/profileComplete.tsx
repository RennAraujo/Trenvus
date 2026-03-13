import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useAuth } from './auth'
import { api } from './api'

export type ProfileData = {
  fullName: string
  address: string
  termsAccepted: boolean
  completedAt: string
}

type ProfileCompleteContextValue = {
  isComplete: boolean
  profileData: ProfileData | null
  completeProfile: (data: Omit<ProfileData, 'completedAt'>) => Promise<void>
  loading: boolean
  error: string | null
}

const ProfileCompleteContext = createContext<ProfileCompleteContextValue | null>(null)

export function ProfileCompleteProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load profile from API on mount
  useEffect(() => {
    async function loadProfile() {
      if (!auth.isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const token = await auth.getValidAccessToken()
        const data = await api.getProfile(token)
        setProfileData({
          fullName: data.fullName,
          address: data.address,
          termsAccepted: data.termsAccepted,
          completedAt: data.createdAt || new Date().toISOString()
        })
      } catch (err: any) {
        if (err?.status === 404) {
          // Profile not found, user hasn't completed it yet
          setProfileData(null)
        } else {
          setError(err?.message || 'Failed to load profile')
          console.error('Failed to load profile:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [auth.isAuthenticated])

  const isComplete = Boolean(
    profileData?.fullName?.trim() &&
    profileData?.address?.trim() &&
    profileData?.termsAccepted,
  )

  const completeProfile = useCallback(
    async (data: Omit<ProfileData, 'completedAt'>) => {
      try {
        setLoading(true)
        setError(null)
        const token = await auth.getValidAccessToken()
        const saved = await api.saveProfile(token, data)
        setProfileData({
          fullName: saved.fullName,
          address: saved.address,
          termsAccepted: saved.termsAccepted,
          completedAt: saved.createdAt || new Date().toISOString()
        })
      } catch (err: any) {
        setError(err?.message || 'Failed to save profile')
        console.error('Failed to save profile:', err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [auth]
  )

  return (
    <ProfileCompleteContext.Provider value={{ isComplete, profileData, completeProfile, loading, error }}>
      {children}
    </ProfileCompleteContext.Provider>
  )
}

export function useProfileComplete(): ProfileCompleteContextValue {
  const ctx = useContext(ProfileCompleteContext)
  if (!ctx) throw new Error('ProfileCompleteProvider missing')
  return ctx
}
