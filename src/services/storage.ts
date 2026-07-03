import type { Tournament, Profile, FightDetail, MediaItem, Goal, Achievement } from '@/types'

// ─── localStorage helpers ───────────────────────────────────────────────────

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function lsSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('localStorage full, falling back to IDB only:', key)
  }
}

// ─── IndexedDB ──────────────────────────────────────────────────────────────

const IDB_NAME = 'judoPhotos'
const IDB_VER = 1
const IDB_STORE = 'photos'
let idb: IDBDatabase | null = null

function openIDB(): Promise<IDBDatabase> {
  if (idb) return Promise.resolve(idb)
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, IDB_VER)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }
    req.onsuccess = (e) => {
      idb = (e.target as IDBOpenDBRequest).result
      idb.onclose = () => { idb = null }
      res(idb)
    }
    req.onerror = (e) => rej((e.target as IDBOpenDBRequest).error)
  })
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await openIDB()
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.oncomplete = () => res()
      tx.onerror = (e) => rej((e.target as IDBRequest).error)
      tx.objectStore(IDB_STORE).put(value ?? null, key)
    })
  } catch (e) {
    console.warn('IDB set failed:', e)
  }
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB()
    return new Promise<T | null>((res) => {
      const tx = db.transaction(IDB_STORE, 'readonly')
      const req = tx.objectStore(IDB_STORE).get(key)
      req.onsuccess = (e) => res(((e.target as IDBRequest).result as T) ?? null)
      req.onerror = () => res(null)
    })
  } catch {
    return null
  }
}

export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openIDB()
    await new Promise<void>((res) => {
      const tx = db.transaction(IDB_STORE, 'readwrite')
      tx.oncomplete = () => res()
      tx.onerror = () => res()
      tx.objectStore(IDB_STORE).delete(key)
    })
  } catch {}
}

// ─── Photo cache ─────────────────────────────────────────────────────────────

const PHOTO_CACHE: Record<string, string> = {}

export async function savePhoto(key: string, dataUrl: string): Promise<void> {
  PHOTO_CACHE[key] = dataUrl
  await idbSet(key, dataUrl)
}

export async function loadPhoto(key: string): Promise<string | null> {
  if (PHOTO_CACHE[key]) return PHOTO_CACHE[key]
  const v = await idbGet<string>(key)
  if (v) PHOTO_CACHE[key] = v
  return v
}

export function getCachedPhoto(key: string): string | undefined {
  return PHOTO_CACHE[key]
}

export async function preloadPhotos(): Promise<void> {
  const keys = ['athlete_photo', 'coach_photo_0', 'coach_photo_1', 'coach_photo_2']
  await Promise.all(keys.map((k) => loadPhoto(k).catch(() => null)))
}

// ─── Tournaments ─────────────────────────────────────────────────────────────

function parseDateToSortKey(date: string): string {
  // DD.MM.YYYY → YYYY-MM-DD
  const m = date.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  // YYYY-MM-DD passthrough
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date
  return '0000-00-00'
}

function sortByDate(a: Tournament, b: Tournament): number {
  const ka = a._sortKey ?? parseDateToSortKey(a.date)
  const kb = b._sortKey ?? parseDateToSortKey(b.date)
  return ka.localeCompare(kb)
}

export async function getComps(): Promise<Tournament[]> {
  const fromLS = lsGet<Tournament[]>('judo_comps')
  if (fromLS) return fromLS
  const fromIDB = await idbGet<Tournament[]>('ls_judo_comps')
  return fromIDB ?? []
}

export async function saveComps(comps: Tournament[]): Promise<void> {
  const sorted = [...comps]
    .map((c) => ({ ...c, _sortKey: c._sortKey ?? parseDateToSortKey(c.date) }))
    .sort(sortByDate)
  lsSet('judo_comps', sorted)
  await idbSet('ls_judo_comps', sorted)
}

export function calcStats(comps: Tournament[]) {
  let fights = 0, wins = 0, losses = 0, gold = 0, silver = 0, bronze = 0
  for (const c of comps) {
    for (const f of c.fights) {
      fights++
      if (f.r === 'w') wins++
      else losses++
    }
    if (c.place === 1) gold++
    else if (c.place === 2) silver++
    else if (c.place === 3) bronze++
  }
  return { tournaments: comps.length, fights, wins, losses, gold, silver, bronze }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function getProfile(): Profile {
  const p = lsGet<Profile>('judo_profile') ?? {}
  const cached = getCachedPhoto('athlete_photo')
  if (cached) p.photo = cached
  for (let i = 0; i < 3; i++) {
    const cp = getCachedPhoto(`coach_photo_${i}`)
    if (cp) {
      const key = `coach${i}` as keyof Profile
      if (!p[key]) (p as Record<string, unknown>)[key] = {}
      ;((p as Record<string, unknown>)[key] as Coach).photo = cp
    }
  }
  return p
}

interface Coach { photo?: string }

export async function saveProfile(p: Profile): Promise<void> {
  const slim: Profile = {}
  for (const [k, v] of Object.entries(p)) {
    if (k === 'photo') continue
    if (k.startsWith('coach') && v && (v as Coach).photo) {
      const { photo: _ph, ...rest } = v as Coach
      ;(slim as Record<string, unknown>)[k] = rest
    } else {
      ;(slim as Record<string, unknown>)[k] = v
    }
  }
  lsSet('judo_profile', slim)
  if (p.photo) await savePhoto('athlete_photo', p.photo)
  for (let i = 0; i < 3; i++) {
    const c = (p as Record<string, unknown>)[`coach${i}`] as Coach | undefined
    if (c?.photo) await savePhoto(`coach_photo_${i}`, c.photo)
  }
}

// ─── Fight details ────────────────────────────────────────────────────────────

export function getFight(cid: string, fi: number): FightDetail {
  return lsGet<FightDetail>(`judo_fight_${cid}_${fi}`) ?? {}
}

export async function saveFight(cid: string, fi: number, data: FightDetail): Promise<void> {
  const key = `judo_fight_${cid}_${fi}`
  lsSet(key, data)
  await idbSet(`ls_${key}`, data)
}

// ─── Media ────────────────────────────────────────────────────────────────────

const MEDIA_CACHE: Record<string, MediaItem[]> = {}

export function getMedia(cid: string): MediaItem[] {
  return MEDIA_CACHE[cid] ?? []
}

export async function saveMedia(cid: string, items: MediaItem[]): Promise<void> {
  MEDIA_CACHE[cid] = items
  await idbSet(`media_${cid}`, items)
}

export async function loadMediaFromIDB(cid: string): Promise<MediaItem[]> {
  const v = await idbGet<MediaItem[]>(`media_${cid}`)
  if (v) MEDIA_CACHE[cid] = v
  return MEDIA_CACHE[cid] ?? []
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export function getGoal(): Goal | null {
  return lsGet<Goal>('judo_goal')
}

export function saveGoal(goal: Goal): void {
  lsSet('judo_goal', goal)
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export function getAchievements(): Achievement[] {
  return lsGet<Achievement[]>('judo_achievements') ?? []
}

export function saveAchievements(list: Achievement[]): void {
  lsSet('judo_achievements', list)
}

// ─── Technique statistics ─────────────────────────────────────────────────────

export function getAllTechStats(comps: Tournament[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const c of comps) {
    for (let fi = 0; fi < c.fights.length; fi++) {
      const d = getFight(c.id, fi)
      const tech = d.f_tech === 'custom' ? (d.f_tech_custom || '') : (d.f_tech || '')
      if (tech) counts[tech] = (counts[tech] ?? 0) + 1
    }
  }
  return counts
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export interface BackupData {
  version: number
  comps: Tournament[]
  profile: Profile
  fights: Array<{ cid: string; fi: number; data: FightDetail }>
}

export async function exportBackup(comps: Tournament[]): Promise<void> {
  const profile = getProfile()
  const fights: BackupData['fights'] = []
  for (const c of comps) {
    for (let fi = 0; fi < c.fights.length; fi++) {
      const d = getFight(c.id, fi)
      if (Object.keys(d).length) fights.push({ cid: c.id, fi, data: d })
    }
  }
  const backup: BackupData = { version: 2, comps, profile, fights }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `judo-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

export async function importBackup(file: File): Promise<Tournament[]> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupData
  if (!Array.isArray(data.comps)) throw new Error('Invalid backup')
  await saveComps(data.comps)
  if (data.profile) await saveProfile(data.profile)
  if (data.fights) {
    for (const { cid, fi, data: fd } of data.fights) {
      await saveFight(cid, fi, fd)
    }
  }
  return data.comps
}
