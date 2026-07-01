import { useState, useEffect, useCallback } from 'react'
import type { Tournament } from '@/types'
import { getComps, saveComps } from '@/services/storage'
import { DEFAULT_COMPS } from '@/data/defaultComps'

export function useComps() {
  const [comps, setComps] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getComps().then((data) => {
      setComps(data.length ? data : DEFAULT_COMPS)
      setLoading(false)
    })
  }, [])

  const updateComps = useCallback(async (next: Tournament[]) => {
    setComps(next)
    await saveComps(next)
  }, [])

  const addComp = useCallback(async (comp: Tournament) => {
    const next = [...comps, comp]
    await updateComps(next)
  }, [comps, updateComps])

  const editComp = useCallback(async (comp: Tournament) => {
    const next = comps.map((c) => (c.id === comp.id ? comp : c))
    await updateComps(next)
  }, [comps, updateComps])

  const deleteComp = useCallback(async (id: string) => {
    const next = comps.filter((c) => c.id !== id)
    await updateComps(next)
  }, [comps, updateComps])

  return { comps, loading, updateComps, addComp, editComp, deleteComp }
}
