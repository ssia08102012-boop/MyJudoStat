export type FightResult = 'w' | 'l'

export interface Fight {
  r: FightResult
}

export interface FightDetail {
  f_opp_name?: string
  f_opp_club?: string
  f_opp_country?: string
  f_opp_age?: string
  f_opp_weight?: string
  f_score_me?: string
  f_score_opp?: string
  f_score_type?: string
  f_stage?: string
  f_tech?: string
  f_tech_custom?: string
  f_duration?: string
  f_notes?: string
}

export interface Tournament {
  id: string
  date: string
  name: string
  location: string
  year: number
  ageCategory: string
  weightCategory: string
  place: number | null
  fights: Fight[]
  notes: string
  yt: string
  pdf: string
  _sortKey?: string
}

export interface Coach {
  name?: string
  role?: string
  photo?: string
}

export interface Profile {
  name?: string
  belt?: string
  weight?: string
  dob?: string
  since?: string
  photo?: string
  coach0?: Coach
  coach1?: Coach
  coach2?: Coach
}

export interface Stats {
  tournaments: number
  fights: number
  wins: number
  losses: number
  gold: number
  silver: number
  bronze: number
}

export interface MediaItem {
  type: 'image' | 'video'
  data: string
}

export interface Goal {
  year: number
  targetWinRate: number
}

export type AchievementId =
  | 'first_tournament'
  | 'first_gold'
  | 'ten_wins'
  | 'five_streak'
  | 'fifty_fights'
  | 'abroad'
  | 'detailed_five'
  | 'hundred_fights'

export interface Achievement {
  id: AchievementId
  unlockedAt?: string
}

export type Lang = 'uk' | 'en' | 'pl'
