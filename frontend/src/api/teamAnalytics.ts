import { getData, patchData, postData } from './client'
import * as mockApi from '../data/mockApi'
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

const USE_MOCK_DATA = String(import.meta.env.VITE_USE_MOCK_DATA ?? 'true').trim().toLowerCase() !== 'false'

async function resolveData<TData>(
  realCall: () => Promise<TData>,
  mockCall: () => Promise<TData>,
): Promise<TData> {
  if (USE_MOCK_DATA) {
    return mockCall()
  }

  try {
    return await realCall()
  } catch {
    return mockCall()
  }
}

function asQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return
    query.set(key, String(value))
  })
  return query.toString() ? `?${query.toString()}` : ''
}

export async function getHealth(): Promise<ApiHealth> {
  return resolveData(
    () => getData<ApiHealth>('/health'),
    () => mockApi.getHealth(),
  )
}

export async function getDashboardTopOptions(params: DashboardTopOptionsParams): Promise<TopOption[]> {
  return resolveData(
    async () => {
      const query = asQueryString({ position: params.position, limit: params.limit ?? 10 })
      const payload = await getData<ListPayload<TopOption>>(`/dashboard/top-options${query}`)
      return payload.items
    },
    () => mockApi.getDashboardTopOptions(params),
  )
}

export async function getDashboardInjuries(): Promise<InjuryItem[]> {
  return resolveData(
    async () => {
      const payload = await getData<ListPayload<InjuryItem>>('/dashboard/key-injuries')
      return payload.items
    },
    () => mockApi.getDashboardInjuries(),
  )
}

export async function getReplacementSummary(): Promise<ReplacementSummary> {
  return resolveData(
    () => getData<ReplacementSummary>('/dashboard/replacement-summary'),
    () => mockApi.getReplacementSummary(),
  )
}

export async function getOpponentSummary(): Promise<OpponentSummary> {
  return resolveData(
    () => getData<OpponentSummary>('/dashboard/opponent-summary'),
    () => mockApi.getOpponentSummary(),
  )
}

export async function getDashboardLineupBoard(): Promise<LineupBoardItem[]> {
  return resolveData(
    async () => {
      const payload = await getData<ListPayload<LineupBoardItem>>('/dashboard/lineup-board')
      return payload.items
    },
    () => mockApi.getDashboardLineupBoard(),
  )
}

export async function listPlayers(params: PlayerListParams = {}): Promise<PlayerSummary[]> {
  return resolveData(
    async () => {
      const query = asQueryString({
        position: params.position,
        status: params.status,
        q: params.q,
      })
      const payload = await getData<ListPayload<PlayerSummary>>(`/players${query}`)
      return payload.items
    },
    () => mockApi.listPlayers(params),
  )
}

export async function createPlayer(payload: PlayerCreatePayload): Promise<PlayerSummary> {
  return resolveData(
    () => postData<PlayerSummary, PlayerCreatePayload>('/players', payload),
    () => mockApi.createPlayer(payload),
  )
}

export async function updatePlayer(playerId: number, payload: PlayerUpdatePayload): Promise<PlayerSummary> {
  return resolveData(
    () => patchData<PlayerSummary, PlayerUpdatePayload>(`/players/${playerId}/update`, payload),
    () => mockApi.updatePlayer(playerId, payload),
  )
}

export async function getPlayerDetail(playerId: number): Promise<PlayerDetail> {
  return resolveData(
    () => getData<PlayerDetail>(`/players/${playerId}`),
    () => mockApi.getPlayerDetail(playerId),
  )
}

export async function getPlayerHistory(playerId: number, params: PlayerHistoryParams = {}): Promise<PlayerHistoryItem[]> {
  return resolveData(
    async () => {
      const query = asQueryString({ last_n: params.last_n ?? 10 })
      const payload = await getData<ListPayload<PlayerHistoryItem>>(`/players/${playerId}/history${query}`)
      return payload.items
    },
    () => mockApi.getPlayerHistory(playerId, params),
  )
}

export async function getNextMatchInsights(): Promise<NextMatchInsightsResponse> {
  return resolveData(
    () => getData<NextMatchInsightsResponse>('/matches/next-insights'),
    () => mockApi.getNextMatchInsights(),
  )
}

export async function getAdminOverview(): Promise<AdminOverview> {
  return resolveData(
    () => getData<AdminOverview>('/admin/overview'),
    () => mockApi.getAdminOverview(),
  )
}

export async function recomputeRecommendations(payload: AdminRecomputePayload): Promise<AdminRecomputeResponse> {
  return resolveData(
    () => postData<AdminRecomputeResponse, AdminRecomputePayload>('/admin/recommendations/recompute', payload),
    () => mockApi.recomputeRecommendations(payload),
  )
}

export async function listInjuries(params: InjuryListParams = {}): Promise<InjuryItem[]> {
  return resolveData(
    async () => {
      const query = asQueryString({ active: params.active ?? 'all' })
      const payload = await getData<ListPayload<InjuryItem>>(`/injuries${query}`)
      return payload.items
    },
    () => mockApi.listInjuries(params),
  )
}

export async function createInjury(payload: InjuryCreatePayload): Promise<InjuryItem> {
  return resolveData(
    () => postData<InjuryItem, InjuryCreatePayload>('/injuries', payload),
    () => mockApi.createInjury(payload),
  )
}

export async function updateInjury(injuryId: number, payload: InjuryUpdatePayload): Promise<InjuryItem> {
  return resolveData(
    () => patchData<InjuryItem, InjuryUpdatePayload>(`/injuries/${injuryId}`, payload),
    () => mockApi.updateInjury(injuryId, payload),
  )
}

export async function getRosterMetadata(): Promise<RosterMetadata> {
  return resolveData(
    () => getData<RosterMetadata>('/meta/roster'),
    () => mockApi.getRosterMetadata(),
  )
}

export async function listPositions(): Promise<PositionRecord[]> {
  return resolveData(
    async () => {
      const payload = await getData<ListPayload<PositionRecord>>('/positions')
      return payload.items
    },
    () => mockApi.listPositions(),
  )
}

export async function getReplacementCandidates(params: ReplacementCandidatesParams): Promise<ReplacementCandidatesPayload> {
  return resolveData(
    () => {
      const query = asQueryString({ player_id: params.player_id, limit: params.limit ?? 10 })
      return getData<ReplacementCandidatesPayload>(`/workflow/replacements/candidates${query}`)
    },
    () => mockApi.getReplacementCandidates(params),
  )
}

export async function listReplacementDecisions(params: ReplacementDecisionListParams = {}): Promise<ReplacementDecision[]> {
  return resolveData(
    async () => {
      const query = asQueryString({ include_inactive: params.include_inactive ?? false })
      const payload = await getData<ListPayload<ReplacementDecision>>(`/workflow/replacements/decisions${query}`)
      return payload.items
    },
    () => mockApi.listReplacementDecisions(params),
  )
}

export async function createReplacementDecision(payload: ReplacementDecisionCreatePayload): Promise<ReplacementDecision> {
  return resolveData(
    () => postData<ReplacementDecision, ReplacementDecisionCreatePayload>('/workflow/replacements/decisions', payload),
    () => mockApi.createReplacementDecision(payload),
  )
}

export async function updateReplacementDecision(decisionId: number, payload: ReplacementDecisionUpdatePayload): Promise<ReplacementDecision> {
  return resolveData(
    () => patchData<ReplacementDecision, ReplacementDecisionUpdatePayload>(`/workflow/replacements/decisions/${decisionId}`, payload),
    () => mockApi.updateReplacementDecision(decisionId, payload),
  )
}
