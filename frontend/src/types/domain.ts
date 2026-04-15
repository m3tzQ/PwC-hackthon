export type PositionKey =
  | 'GK'
  | 'RB'
  | 'CB'
  | 'LB'
  | 'DM'
  | 'CM'
  | 'AM'
  | 'RW'
  | 'LW'
  | 'ST'

export type AvailabilityStatus = 'Fit' | 'Questionable' | 'Out'
export type InjuryRisk = 'Low' | 'Medium' | 'High'

export interface PlayerSkillProfile {
  finishing: number
  passing: number
  pressing: number
  aerialDuels: number
  creativity: number
}

export interface Player {
  id: number
  name: string
  age: number
  club: string
  primaryPosition: PositionKey
  secondaryPositions: PositionKey[]
  availability: AvailabilityStatus
  injuryRisk: InjuryRisk
  recentForm: number
  fitnessScore: number
  minutesLast5: number
  goalsLast5: number
  assistsLast5: number
  recommendationScore: number
  styleTags: string[]
  overview: string
  skills: PlayerSkillProfile
}

export interface InjuryAlert {
  playerName: string
  issue: string
  severity: 'High' | 'Medium' | 'Low'
  expectedReturn: string
}

export interface MatchStatLine {
  playerId: number
  date: string
  opponent: string
  competition: string
  result: string
  minutes: number
  goals: number
  assists: number
  keyPasses: number
  duelsWon: number
  rating: number
}

export interface OpponentInsight {
  opponentName: string
  fifaRank: number
  preferredFormation: string
  strengths: string[]
  vulnerabilities: string[]
  keyThreats: string[]
  strategyNotes: string[]
}

export interface AdminKpi {
  label: string
  value: string
  change: string
}

export interface IngestionLog {
  id: string
  source: string
  status: 'Success' | 'Warning' | 'Failed'
  updatedAt: string
  records: number
}
