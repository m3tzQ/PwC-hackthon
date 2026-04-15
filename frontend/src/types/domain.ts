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

export type PlayerStatus = 'FIT' | 'INJ' | 'SUS'

export interface PlayerSummary {
  id: number
  name: string
  status: PlayerStatus
  primary_position: PositionKey | null
  team_name: string
  current_club_name: string | null
  overall_rating: number
  recent_form_index: number
  fitness_score: number
  minutes_last_5: number
  goal_contribution_rate: number
  suitability_score: number
}

export interface PlayerDetail {
  id: number
  name: string
  status: PlayerStatus
  primary_position: PositionKey | null
  team_name: string
  current_club_name: string | null
  overall_rating: number
  pace: number
  passing: number
  stamina: number
  recent_form_index: number
  fitness_score: number
  minutes_last_5: number
  goal_contribution_rate: number
  season_summary: {
    minutes_last_5: number
    goal_contribution_rate: number
  }
  strengths: string[]
  suitability_score: number
}

export interface PlayerCreatePayload {
  name: string
  team_id: number
  current_club_id?: number | null
  primary_position_id?: number | null
  secondary_position_ids?: number[]
  is_local_league?: boolean
  status?: PlayerStatus
  overall_rating: number
  pace?: number
  passing?: number
  stamina?: number
  recent_form_index?: number
  fitness_score?: number
  minutes_last_5?: number
  goal_contribution_rate?: number
}

export interface PlayerUpdatePayload {
  name?: string
  team_id?: number
  current_club_id?: number | null
  primary_position_id?: number | null
  secondary_position_ids?: number[]
  is_local_league?: boolean
  status?: PlayerStatus
  overall_rating?: number
  pace?: number
  passing?: number
  stamina?: number
  recent_form_index?: number
  fitness_score?: number
  minutes_last_5?: number
  goal_contribution_rate?: number
}

export interface TopOption {
  snapshot_id: number | null
  player_id: number
  player_name: string
  position: PositionKey
  rank_score: number
  confidence: number
  why_recommended: string[]
  risk_flags: string[]
}

export interface InjuryItem {
  id: number
  player_id: number
  player_name: string
  position: PositionKey | null
  injury_name: string
  severity: string
  start_date: string
  expected_return_date: string | null
  is_active: boolean
}

export interface InjuryCreatePayload {
  player_id: number
  injury_name: string
  severity: string
  start_date: string
  expected_return_date?: string | null
  is_active?: boolean
}

export interface InjuryUpdatePayload {
  player_id?: number
  injury_name?: string
  severity?: string
  start_date?: string
  expected_return_date?: string | null
  is_active?: boolean
}

export interface ReplacementSummary {
  injured_count: number
  fit_count: number
  coverage_health_ratio: number
  active_replacement_decisions: number
}

export interface OpponentSummary {
  opponent: string | null
  tactical_style?: string
  strengths?: string[]
  weaknesses?: string[]
  summary?: string
}

export interface LineupBoardItem {
  position: PositionKey
  player_id: number | null
  player_name: string
  fitness_score: number
  source: 'decision' | 'snapshot' | 'live' | 'empty'
  decision_id: number | null
  injured_player_name: string | null
}

export interface PlayerHistoryItem {
  id: number
  match_date: string
  opponent: string
  minutes_played: number
  distance_covered_km: number
  pass_accuracy_percent: number
  rating: number
  goals: number
  assists: number
}

export interface MatchLineupScenario {
  label: string
  focus: string
}

export interface MatchInsightsData {
  id: number
  date: string
  opponent: string
  goals_for: number
  goals_against: number
  tactical_strengths: string[]
  tactical_weaknesses: string[]
  lineup_scenarios: MatchLineupScenario[]
  opponent_tactical_style: string
}

export interface ReplacementDecision {
  id: number
  injured_player_id: number
  injured_player_name: string
  replacement_player_id: number
  replacement_player_name: string
  position: PositionKey | null
  notes: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReplacementDecisionCreatePayload {
  injured_player_id: number
  replacement_player_id: number
  position_id?: number
  notes?: string
  is_active?: boolean
}

export interface ReplacementDecisionUpdatePayload {
  replacement_player_id?: number
  position_id?: number
  notes?: string
  is_active?: boolean
}

export interface ReplacementCandidatesPayload {
  injured_player: {
    id: number
    name: string
    position: PositionKey
  }
  items: TopOption[]
}

export interface AdminOverview {
  players_total: number
  active_injuries: number
  active_replacement_decisions: number
  latest_snapshot_at: string | null
  data_freshness: 'healthy' | 'stale'
}

export interface PositionRecord {
  id: number
  code: PositionKey
  label: string
}

export interface TeamRecord {
  id: number
  name: string
  fifa_code: string
}

export interface ClubRecord {
  id: number
  name: string
  country: string
}

export interface RosterMetadata {
  positions: PositionRecord[]
  teams: TeamRecord[]
  clubs: ClubRecord[]
}

export interface ApiErrorShape {
  code: string
  message: string
  details: Record<string, unknown>
  trace_id: string
}

export interface ApiEnvelope<TData> {
  success: boolean
  data: TData
  meta: Record<string, unknown>
  error: ApiErrorShape | null
}

export interface ListPayload<TItem> {
  items: TItem[]
}

export interface AdminRecomputePayload {
  position: PositionKey
  run_label?: string
  clear_existing?: boolean
}

export interface AdminRecomputeResponse {
  created_snapshots: number
  run_label: string
  clear_existing: boolean
}

export interface DashboardTopOptionsParams {
  position: PositionKey
  limit?: number
}

export interface PlayerHistoryParams {
  last_n?: number
}

export interface PlayerListParams {
  position?: PositionKey
  status?: PlayerStatus
  q?: string
}

export interface InjuryListParams {
  active?: 'true' | 'false' | 'all'
}

export interface ReplacementDecisionListParams {
  include_inactive?: boolean
}

export interface ReplacementCandidatesParams {
  player_id: number
  limit?: number
}

export interface ApiHealth {
  service: string
  status: string
}

export interface NextMatchEmptyPayload {
  match: null
  summary: string
}

export type NextMatchInsightsResponse = MatchInsightsData | NextMatchEmptyPayload

export interface PositionSelectionState {
  [position: string]: TopOption
}

export interface PlayerFormState {
  name: string
  team_id: number
  current_club_id: number | null
  primary_position_id: number | null
  overall_rating: number
  status: PlayerStatus
  recentForm: number
  fitness_score: number
  minutes_last_5: number
  goal_contribution_rate: number
}
