import type { Tournament, Achievement, AchievementId } from '@/types'
import { getFight } from './storage'

interface AchievementDef {
  id: AchievementId
  check: (comps: Tournament[]) => boolean
}

const DEFS: AchievementDef[] = [
  {
    id: 'first_tournament',
    check: (c) => c.length >= 1,
  },
  {
    id: 'first_gold',
    check: (c) => c.some((t) => t.place === 1),
  },
  {
    id: 'ten_wins',
    check: (c) => c.reduce((s, t) => s + t.fights.filter((f) => f.r === 'w').length, 0) >= 10,
  },
  {
    id: 'five_streak',
    check: (c) => {
      let streak = 0
      for (const t of c) {
        for (const f of t.fights) {
          if (f.r === 'w') { streak++; if (streak >= 5) return true }
          else streak = 0
        }
      }
      return false
    },
  },
  {
    id: 'fifty_fights',
    check: (c) => c.reduce((s, t) => s + t.fights.length, 0) >= 50,
  },
  {
    id: 'abroad',
    check: (c) => {
      const polandCities = ['warszawa', 'kraków', 'wrocław', 'gdańsk', 'poznań', 'lublin',
        'białystok', 'szczecin', 'katowice', 'łódź', 'radom', 'siedlce', 'zamość',
        'skierniewice', 'płock', 'kielce', 'kowala', 'białołęka', 'świdnik', 'bytom']
      return c.some((t) => {
        const loc = (t.location || '').toLowerCase()
        if (!loc) return false
        const isPolish = polandCities.some((city) => loc.includes(city))
        return !isPolish
      })
    },
  },
  {
    id: 'detailed_five',
    check: (c) => {
      let detailed = 0
      for (const t of c) {
        for (let fi = 0; fi < t.fights.length; fi++) {
          const d = getFight(t.id, fi)
          if (d.f_opp_name || d.f_tech || d.f_notes) detailed++
          if (detailed >= 5) return true
        }
      }
      return false
    },
  },
  {
    id: 'hundred_fights',
    check: (c) => c.reduce((s, t) => s + t.fights.length, 0) >= 100,
  },
]

export function computeAchievements(
  comps: Tournament[],
  existing: Achievement[],
): Achievement[] {
  const now = new Date().toISOString()
  const existingMap = new Map(existing.map((a) => [a.id, a]))
  const result: Achievement[] = []

  for (const def of DEFS) {
    const prev = existingMap.get(def.id)
    if (prev?.unlockedAt) {
      result.push(prev)
    } else if (def.check(comps)) {
      result.push({ id: def.id, unlockedAt: now })
    } else {
      result.push({ id: def.id })
    }
  }
  return result
}
