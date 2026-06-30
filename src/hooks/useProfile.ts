import { useState, useEffect, useCallback } from 'react'
import type { Profile } from '@/types'
import { getProfile, saveProfile, preloadPhotos } from '@/services/storage'

export function useProfile() {
  const [profile, setProfile] = useState<Profile>({})
  const [photosReady, setPhotosReady] = useState(false)

  useEffect(() => {
    preloadPhotos().then(() => {
      setProfile(getProfile())
      setPhotosReady(true)
    })
  }, [])

  const updateProfile = useCallback(async (next: Profile) => {
    setProfile(next)
    await saveProfile(next)
  }, [])

  return { profile, photosReady, updateProfile }
}
