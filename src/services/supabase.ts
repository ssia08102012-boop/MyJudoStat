import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Tournament, Profile, FightDetail } from '@/types'
import { getFight, getProfile } from './storage'

const SB_URL = 'https://ogiqpuqeatwhxjezwhai.supabase.co'
const SB_KEY = 'sb_publishable_eVnn57rF0pMLeW5NLg8hGw_0rCs9pkJ'

let client: SupabaseClient | null = null

function getSB(): SupabaseClient {
  if (!client) client = createClient(SB_URL, SB_KEY)
  return client
}

function getUserId(): string | null {
  return localStorage.getItem('judo_sync_id')
}

export async function syncPush(comps: Tournament[]): Promise<void> {
  const uid = getUserId()
  if (!uid) throw new Error('No sync ID configured')
  const sb = getSB()

  const profile = getProfile()
  const fights: Array<{ uid: string; cid: string; fi: number; data: FightDetail }> = []
  for (const c of comps) {
    for (let fi = 0; fi < c.fights.length; fi++) {
      const d = getFight(c.id, fi)
      if (Object.keys(d).length) fights.push({ uid, cid: c.id, fi, data: d })
    }
  }

  await Promise.all([
    sb.from('judo_comps').upsert({ uid, data: comps }, { onConflict: 'uid' }),
    sb.from('judo_profile').upsert({ uid, data: profile }, { onConflict: 'uid' }),
    fights.length
      ? sb.from('judo_fights').upsert({ uid, data: fights }, { onConflict: 'uid' })
      : Promise.resolve(),
  ])
}

export async function syncPull(): Promise<{
  comps: Tournament[] | null
  profile: Profile | null
  fights: Array<{ cid: string; fi: number; data: FightDetail }> | null
}> {
  const uid = getUserId()
  if (!uid) throw new Error('No sync ID configured')
  const sb = getSB()

  const [cr, pr, fr] = await Promise.all([
    sb.from('judo_comps').select('data').eq('uid', uid).single(),
    sb.from('judo_profile').select('data').eq('uid', uid).single(),
    sb.from('judo_fights').select('data').eq('uid', uid).single(),
  ])

  return {
    comps: cr.data?.data ?? null,
    profile: pr.data?.data ?? null,
    fights: fr.data?.data ?? null,
  }
}
