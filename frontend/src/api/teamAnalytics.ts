import { getData, patchData, postData } from './client'
import type {
  AdminOverview,
  AdminRecomputePayload,
  AdminRecomputeResponse,
  ApiHealth,
  DashboardTopOptionsParams,
  InjuryCreatePayload,
  InjuryItem,
  InjuryListParams,
  InjuryUpdatePayload,
  LineupBoardItem,
  ListPayload,
  MatchInsightsData,
  NextMatchInsightsResponse,
  OpponentSummary,
  PlayerCreatePayload,
  PlayerDetail,
  PlayerHistoryItem,
  PlayerHistoryParams,
  PlayerListParams,
  PlayerSummary,
  PlayerUpdatePayload,
  PositionRecord,
  ReplacementCandidatesParams,
  ReplacementCandidatesPayload,
  ReplacementDecision,
  ReplacementDecisionCreatePayload,
  ReplacementDecisionListParams,
  ReplacementDecisionUpdatePayload,
  ReplacementSummary,
  RosterMetadata,
  TopOption,
} from '../types/domain'

function asQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return
    query.set(key, String(value))
  })
  return query.toString() ? `?${query.toString()}` : ''
}

export async function getHealth(): Promise<ApiHealth> {
  return getData<ApiHealth>('/health')
}

export async function getDashboardTopOptions(params: DashboardTopOptionsParams): Promise<TopOption[]> {
  const query = asQueryString({ position: params.position, limit: params.limit ?? 10 })
  const payload = await getData<ListPayload<TopOption>>(`/dashboard/top-options${query}`)
  return payload.items
}

export async function getDashboardInjuries(): Promise<InjuryItem[]> {
  const payload = await getData<ListPayload<InjuryItem>>('/dashboard/key-injuries')
  return payload.items
}

export async function getReplacementSummary(): Promise<ReplacementSummary> {
  return getData<ReplacementSummary>('/dashboard/replacement-summary')
}

export async function getOpponentSummary(): Promise<OpponentSummary> {
  return getData<OpponentSummary>('/dashboard/opponent-summary')
}

export async function getDashboardLineupBoard(): Promise<LineupBoardItem[]> {
  const payload = await getData<ListPayload<LineupBoardItem>>('/dashboard/lineup-board')
  return payload.items
}

export async function listPlayers(params: PlayerListParams = {}): Promise<PlayerSummary[]> {
  const query = asQueryString({
    position: params.position,
    status: params.status,
    q: params.q,
  })
  const payload = await getData<ListPayload<PlayerSummary>>(`/players${query}`)
  return payload.items
}

export async function createPlayer(payload: PlayerCreatePayload): Promise<PlayerSummary> {
  return postData<PlayerSummary, PlayerCreatePayload>('/players', payload)
}

export async function updatePlayer(playerId: number, payload: PlayerUpdatePayload): Promise<PlayerSummary> {
  return patchData<PlayerSummary, PlayerUpdatePayload>(`/players/${playerId}/update`, payload)
}

export async function getPlayerDetail(playerId: number): Promise<PlayerDetail> {
  return getData<PlayerDetail>(`/players/${playerId}`)
}

export async function getPlayerHistory(playerId: number, params: PlayerHistoryParams = {}): Promise<PlayerHistoryItem[]> {
  const query = asQueryString({ last_n: params.last_n ?? 10 })
  const payload = await getData<ListPayload<PlayerHistoryItem>>(`/players/${playerId}/history${query}`)
  return payload.items
}

export async function getNextMatchInsights(): Promise<NextMatchInsightsResponse> {
  return getData<NextMatchInsightsResponse>('/matches/next-insights')
}

export async function getAdminOverview(): Promise<AdminOverview> {
  return getData<AdminOverview>('/admin/overview')
}

export async function recomputeRecommendations(payload: AdminRecomputePayload): Promise<AdminRecomputeResponse> {
  return postData<AdminRecomputeResponse, AdminRecomputePayload>('/admin/recommendations/recompute', payload)
}

export async function listInjuries(params: InjuryListParams = {}): Promise<InjuryItem[]> {
  const query = asQueryString({ active: params.active ?? 'all' })
  const payload = await getData<ListPayload<InjuryItem>>(`/injuries${query}`)
  return payload.items
}

export async function createInjury(payload: InjuryCreatePayload): Promise<InjuryItem> {
  return postData<InjuryItem, InjuryCreatePayload>('/injuries', payload)
}

export async function updateInjury(injuryId: number, payload: InjuryUpdatePayload): Promise<InjuryItem> {
  return patchData<InjuryItem, InjuryUpdatePayload>(`/injuries/${injuryId}`, payload)
}

export async function getRosterMetadata(): Promise<RosterMetadata> {
  return getData<RosterMetadata>('/meta/roster')
}

export async function listPositions(): Promise<PositionRecord[]> {
  const payload = await getData<ListPayload<PositionRecord>>('/positions')
  return payload.items
}

export async function getReplacementCandidates(params: ReplacementCandidatesParams): Promise<ReplacementCandidatesPayload> {
  const query = asQueryString({ player_id: params.player_id, limit: params.limit ?? 10 })
  return getData<ReplacementCandidatesPayload>(`/workflow/replacements/candidates${query}`)
}

export async function listReplacementDecisions(params: ReplacementDecisionListParams = {}): Promise<ReplacementDecision[]> {
  const query = asQueryString({ include_inactive: params.include_inactive ?? false })
  const payload = await getData<ListPayload<ReplacementDecision>>(`/workflow/replacements/decisions${query}`)
  return payload.items
}

export async function createReplacementDecision(payload: ReplacementDecisionCreatePayload): Promise<ReplacementDecision> {
  return postData<ReplacementDecision, ReplacementDecisionCreatePayload>('/workflow/replacements/decisions', payload)
}

export async function updateReplacementDecision(decisionId: number, payload: ReplacementDecisionUpdatePayload): Promise<ReplacementDecision> {
  return patchData<ReplacementDecision, ReplacementDecisionUpdatePayload>(`/workflow/replacements/decisions/${decisionId}`, payload)
}
