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
  NextMatchInsightsResponse,
  OpponentSummary,
  PlayerCreatePayload,
  PlayerDetail,
  PlayerHistoryItem,
  PlayerHistoryParams,
  PlayerListParams,
  PlayerStatus,
  PlayerSummary,
  PlayerUpdatePayload,
  PositionKey,
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

interface InternalTeam {
  id: number
  name: string
  fifa_code: string
}

interface InternalClub {
  id: number
  name: string
  country: string
}

interface InternalPlayer {
  id: number
  name: string
  status: PlayerStatus
  team_id: number
  current_club_id: number | null
  primary_position: PositionKey | null
  secondary_positions: PositionKey[]
  overall_rating: number
  pace: number
  passing: number
  stamina: number
  recent_form_index: number
  fitness_score: number
  minutes_last_5: number
  goal_contribution_rate: number
}

interface InternalInjury {
  id: number
  player_id: number
  injury_name: string
  severity: string
  start_date: string
  expected_return_date: string | null
  is_active: boolean
}

interface InternalDecision {
  id: number
  injured_player_id: number
  replacement_player_id: number
  position_id: number | null
  notes: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const FORMATION_ORDER: PositionKey[] = ['GK', 'RB', 'CB', 'LB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST']

const positions: PositionRecord[] = [
  { id: 1, code: 'GK', label: 'Goalkeeper' },
  { id: 2, code: 'RB', label: 'Right Back' },
  { id: 3, code: 'CB', label: 'Center Back' },
  { id: 4, code: 'LB', label: 'Left Back' },
  { id: 5, code: 'DM', label: 'Defensive Midfielder' },
  { id: 6, code: 'CM', label: 'Central Midfielder' },
  { id: 7, code: 'AM', label: 'Attacking Midfielder' },
  { id: 8, code: 'RW', label: 'Right Winger' },
  { id: 9, code: 'LW', label: 'Left Winger' },
  { id: 10, code: 'ST', label: 'Striker' },
]

const teams: InternalTeam[] = [
  { id: 1, name: 'Jordan', fifa_code: 'JOR' },
  { id: 2, name: 'Morocco', fifa_code: 'MAR' },
  { id: 3, name: 'Spain', fifa_code: 'ESP' },
]

const clubs: InternalClub[] = [
  { id: 1, name: 'Al Wehdat', country: 'Jordan' },
  { id: 2, name: 'Montpellier', country: 'France' },
  { id: 3, name: 'Al Faisaly', country: 'Jordan' },
  { id: 4, name: 'Al Hussein', country: 'Jordan' },
  { id: 5, name: 'Al Arabi SC', country: 'Qatar' },
]

let players: InternalPlayer[] = [
  {
    id: 1,
    name: 'Yazan Al Naimat',
    status: 'INJ',
    team_id: 1,
    current_club_id: 5,
    primary_position: 'ST',
    secondary_positions: ['LW'],
    overall_rating: 82,
    pace: 80,
    passing: 67,
    stamina: 73,
    recent_form_index: 78,
    fitness_score: 58,
    minutes_last_5: 342,
    goal_contribution_rate: 0.61,
  },
  {
    id: 2,
    name: 'Ali Olwan',
    status: 'FIT',
    team_id: 1,
    current_club_id: 5,
    primary_position: 'LW',
    secondary_positions: ['ST', 'RW'],
    overall_rating: 80,
    pace: 78,
    passing: 70,
    stamina: 75,
    recent_form_index: 80,
    fitness_score: 86,
    minutes_last_5: 395,
    goal_contribution_rate: 0.52,
  },
  {
    id: 3,
    name: 'Mousa Al Tamari',
    status: 'FIT',
    team_id: 1,
    current_club_id: 2,
    primary_position: 'RW',
    secondary_positions: ['LW', 'AM'],
    overall_rating: 88,
    pace: 91,
    passing: 82,
    stamina: 86,
    recent_form_index: 90,
    fitness_score: 91,
    minutes_last_5: 430,
    goal_contribution_rate: 0.72,
  },
  {
    id: 4,
    name: 'Nizar Al Rashdan',
    status: 'FIT',
    team_id: 1,
    current_club_id: 3,
    primary_position: 'CM',
    secondary_positions: ['DM'],
    overall_rating: 79,
    pace: 66,
    passing: 82,
    stamina: 84,
    recent_form_index: 82,
    fitness_score: 87,
    minutes_last_5: 420,
    goal_contribution_rate: 0.39,
  },
  {
    id: 5,
    name: 'Yazeed Abu Laila',
    status: 'FIT',
    team_id: 1,
    current_club_id: 3,
    primary_position: 'GK',
    secondary_positions: [],
    overall_rating: 81,
    pace: 45,
    passing: 73,
    stamina: 79,
    recent_form_index: 83,
    fitness_score: 88,
    minutes_last_5: 450,
    goal_contribution_rate: 0.05,
  },
  {
    id: 6,
    name: 'Ehsan Haddad',
    status: 'FIT',
    team_id: 1,
    current_club_id: 3,
    primary_position: 'RB',
    secondary_positions: ['CB'],
    overall_rating: 76,
    pace: 71,
    passing: 72,
    stamina: 80,
    recent_form_index: 76,
    fitness_score: 82,
    minutes_last_5: 370,
    goal_contribution_rate: 0.18,
  },
  {
    id: 7,
    name: 'Yazan Al Arab',
    status: 'FIT',
    team_id: 1,
    current_club_id: 4,
    primary_position: 'CB',
    secondary_positions: ['RB'],
    overall_rating: 80,
    pace: 62,
    passing: 74,
    stamina: 84,
    recent_form_index: 82,
    fitness_score: 84,
    minutes_last_5: 420,
    goal_contribution_rate: 0.22,
  },
  {
    id: 8,
    name: 'Abdallah Nasib',
    status: 'FIT',
    team_id: 1,
    current_club_id: 4,
    primary_position: 'CB',
    secondary_positions: ['DM'],
    overall_rating: 78,
    pace: 60,
    passing: 70,
    stamina: 82,
    recent_form_index: 79,
    fitness_score: 80,
    minutes_last_5: 395,
    goal_contribution_rate: 0.19,
  },
  {
    id: 9,
    name: 'Ibrahim Sadeh',
    status: 'FIT',
    team_id: 1,
    current_club_id: 1,
    primary_position: 'LB',
    secondary_positions: ['LW'],
    overall_rating: 77,
    pace: 76,
    passing: 76,
    stamina: 85,
    recent_form_index: 79,
    fitness_score: 85,
    minutes_last_5: 405,
    goal_contribution_rate: 0.24,
  },
  {
    id: 10,
    name: 'Mahmoud Al Mardi',
    status: 'FIT',
    team_id: 1,
    current_club_id: 3,
    primary_position: 'AM',
    secondary_positions: ['RW', 'CM'],
    overall_rating: 79,
    pace: 80,
    passing: 84,
    stamina: 81,
    recent_form_index: 78,
    fitness_score: 83,
    minutes_last_5: 366,
    goal_contribution_rate: 0.46,
  },
]

let injuries: InternalInjury[] = [
  {
    id: 1,
    player_id: 1,
    injury_name: 'Hamstring strain',
    severity: 'high',
    start_date: isoDayOffset(-2),
    expected_return_date: isoDayOffset(9),
    is_active: true,
  },
]

let decisions: InternalDecision[] = [
  {
    id: 1,
    injured_player_id: 1,
    replacement_player_id: 2,
    position_id: positionIdByCode('ST'),
    notes: 'Initial emergency replacement decision.',
    is_active: true,
    created_at: isoTimestampOffset(-60),
    updated_at: isoTimestampOffset(-60),
  },
]

const historyRows: PlayerHistoryItem[] = [
  {
    id: 1,
    match_date: isoDayOffset(-20),
    opponent: 'Iraq',
    minutes_played: 90,
    distance_covered_km: 10.2,
    pass_accuracy_percent: 84,
    rating: 8.1,
    goals: 1,
    assists: 1,
  },
  {
    id: 2,
    match_date: isoDayOffset(-12),
    opponent: 'Uzbekistan',
    minutes_played: 88,
    distance_covered_km: 10.8,
    pass_accuracy_percent: 82,
    rating: 7.9,
    goals: 1,
    assists: 0,
  },
  {
    id: 3,
    match_date: isoDayOffset(-6),
    opponent: 'Saudi Arabia',
    minutes_played: 90,
    distance_covered_km: 11.1,
    pass_accuracy_percent: 85,
    rating: 8.3,
    goals: 1,
    assists: 1,
  },
]

let nextPlayerId = players.length + 1
let nextInjuryId = injuries.length + 1
let nextDecisionId = decisions.length + 1
let nextSnapshotId = 100
let latestSnapshotAt = isoTimestampOffset(-30)

const staticInsights: NextMatchInsightsResponse = {
  id: 901,
  date: isoDayOffset(4),
  opponent: 'Morocco',
  goals_for: 0,
  goals_against: 0,
  tactical_strengths: [
    'Compact midfield press',
    'Fast wing transitions',
    'Aggressive set-piece second balls',
  ],
  tactical_weaknesses: [
    'Space behind fullbacks',
    'Transition recovery when first press is bypassed',
    'Vulnerability to quick wide switches',
  ],
  lineup_scenarios: [
    { label: 'Balanced 4-2-3-1', focus: 'Protect central lanes and transition quickly to the right wing.' },
    { label: 'Aggressive 4-3-3', focus: 'High press triggers after forcing play to Morocco left side.' },
  ],
  opponent_tactical_style: 'High pressing with compact midfield block',
}

function isoDayOffset(offsetDays: number): string {
  const now = new Date()
  now.setDate(now.getDate() + offsetDays)
  return now.toISOString().slice(0, 10)
}

function isoTimestampOffset(offsetMinutes: number): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() + offsetMinutes)
  return now.toISOString()
}

function delay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 30)
  })
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function scorePlayer(player: InternalPlayer): number {
  return round2((player.overall_rating * 0.5) + (player.recent_form_index * 0.3) + (player.fitness_score * 0.2))
}

function confidenceForPlayer(player: InternalPlayer): number {
  const normalized = Math.max(0.1, Math.min(0.99, player.fitness_score / 100))
  return round2(normalized)
}

function findPlayer(playerId: number): InternalPlayer {
  const player = players.find((item) => item.id === playerId)
  if (!player) {
    throw new Error(`Player ${playerId} was not found in mock dataset.`)
  }
  return player
}

function teamName(teamId: number): string {
  return teams.find((team) => team.id === teamId)?.name ?? 'Unknown'
}

function clubName(clubId: number | null): string | null {
  if (!clubId) return null
  return clubs.find((club) => club.id === clubId)?.name ?? null
}

function positionIdByCode(code: PositionKey): number {
  return positions.find((item) => item.code === code)?.id ?? 0
}

function positionCodeById(positionId: number | null): PositionKey | null {
  if (!positionId) return null
  return positions.find((item) => item.id === positionId)?.code ?? null
}

function buildStrengths(player: InternalPlayer): string[] {
  const strengths: string[] = []
  if (player.passing >= 78) strengths.push('High passing range')
  if (player.stamina >= 82) strengths.push('Strong work rate')
  if (player.pace >= 80) strengths.push('Acceleration threat')
  if (!strengths.length) strengths.push('Balanced profile')
  return strengths
}

function toPlayerSummary(player: InternalPlayer): PlayerSummary {
  return {
    id: player.id,
    name: player.name,
    status: player.status,
    primary_position: player.primary_position,
    team_name: teamName(player.team_id),
    current_club_name: clubName(player.current_club_id),
    overall_rating: player.overall_rating,
    recent_form_index: round2(player.recent_form_index),
    fitness_score: round2(player.fitness_score),
    minutes_last_5: player.minutes_last_5,
    goal_contribution_rate: round2(player.goal_contribution_rate),
    suitability_score: scorePlayer(player),
  }
}

function toPlayerDetail(player: InternalPlayer): PlayerDetail {
  return {
    ...toPlayerSummary(player),
    pace: player.pace,
    passing: player.passing,
    stamina: player.stamina,
    season_summary: {
      minutes_last_5: player.minutes_last_5,
      goal_contribution_rate: round2(player.goal_contribution_rate),
    },
    strengths: buildStrengths(player),
  }
}

function getCandidatesForPosition(position: PositionKey, limit: number, excludePlayerId?: number): InternalPlayer[] {
  return players
    .filter((player) => player.status === 'FIT')
    .filter((player) => player.primary_position === position || player.secondary_positions.includes(position))
    .filter((player) => !excludePlayerId || player.id !== excludePlayerId)
    .sort((a, b) => scorePlayer(b) - scorePlayer(a))
    .slice(0, limit)
}

function toTopOption(player: InternalPlayer, position: PositionKey): TopOption {
  return {
    snapshot_id: nextSnapshotId++,
    player_id: player.id,
    player_name: player.name,
    position,
    rank_score: scorePlayer(player),
    confidence: confidenceForPlayer(player),
    why_recommended: [
      'Strong suitability score',
      'Current status is FIT',
      'Role compatibility for selected position',
    ],
    risk_flags: player.fitness_score < 70 ? ['Minor injury risk'] : [],
  }
}

function toInjuryItem(injury: InternalInjury): InjuryItem {
  const player = findPlayer(injury.player_id)
  return {
    id: injury.id,
    player_id: player.id,
    player_name: player.name,
    position: player.primary_position,
    injury_name: injury.injury_name,
    severity: injury.severity,
    start_date: injury.start_date,
    expected_return_date: injury.expected_return_date,
    is_active: injury.is_active,
  }
}

function toDecisionItem(decision: InternalDecision): ReplacementDecision {
  const injured = findPlayer(decision.injured_player_id)
  const replacement = findPlayer(decision.replacement_player_id)
  return {
    id: decision.id,
    injured_player_id: injured.id,
    injured_player_name: injured.name,
    replacement_player_id: replacement.id,
    replacement_player_name: replacement.name,
    position: positionCodeById(decision.position_id),
    notes: decision.notes,
    is_active: decision.is_active,
    created_at: decision.created_at,
    updated_at: decision.updated_at,
  }
}

export async function getHealth(): Promise<ApiHealth> {
  await delay()
  return { service: 'team_analytics_mock', status: 'ok' }
}

export async function getDashboardTopOptions(params: DashboardTopOptionsParams): Promise<TopOption[]> {
  await delay()
  const candidates = getCandidatesForPosition(params.position, params.limit ?? 10)
  return candidates.map((player) => toTopOption(player, params.position))
}

export async function getDashboardInjuries(): Promise<InjuryItem[]> {
  await delay()
  return injuries
    .filter((injury) => injury.is_active)
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map(toInjuryItem)
}

export async function getReplacementSummary(): Promise<ReplacementSummary> {
  await delay()
  const injuredCount = players.filter((player) => player.status === 'INJ').length
  const fitCount = players.filter((player) => player.status === 'FIT').length
  return {
    injured_count: injuredCount,
    fit_count: fitCount,
    coverage_health_ratio: round2(fitCount / Math.max(injuredCount, 1)),
    active_replacement_decisions: decisions.filter((decision) => decision.is_active).length,
  }
}

export async function getOpponentSummary(): Promise<OpponentSummary> {
  await delay()
  if ('match' in staticInsights) {
    return { opponent: null, summary: staticInsights.summary }
  }
  return {
    opponent: staticInsights.opponent,
    tactical_style: staticInsights.opponent_tactical_style,
    strengths: staticInsights.tactical_strengths,
    weaknesses: staticInsights.tactical_weaknesses,
  }
}

export async function getDashboardLineupBoard(): Promise<LineupBoardItem[]> {
  await delay()

  return FORMATION_ORDER.map((position) => {
    const activeDecision = decisions
      .filter((decision) => decision.is_active)
      .find((decision) => positionCodeById(decision.position_id) === position)

    if (activeDecision) {
      const replacement = findPlayer(activeDecision.replacement_player_id)
      const injured = findPlayer(activeDecision.injured_player_id)
      return {
        position,
        player_id: replacement.id,
        player_name: replacement.name,
        fitness_score: replacement.fitness_score,
        source: 'decision',
        decision_id: activeDecision.id,
        injured_player_name: injured.name,
      }
    }

    const fallback = getCandidatesForPosition(position, 1)[0]
    if (fallback) {
      return {
        position,
        player_id: fallback.id,
        player_name: fallback.name,
        fitness_score: fallback.fitness_score,
        source: 'snapshot',
        decision_id: null,
        injured_player_name: null,
      }
    }

    return {
      position,
      player_id: null,
      player_name: 'TBD',
      fitness_score: 0,
      source: 'empty',
      decision_id: null,
      injured_player_name: null,
    }
  })
}

export async function listPlayers(params: PlayerListParams = {}): Promise<PlayerSummary[]> {
  await delay()
  let items = [...players]

  if (params.position) {
    items = items.filter((player) => player.primary_position === params.position)
  }
  if (params.status) {
    items = items.filter((player) => player.status === params.status)
  }
  if (params.q) {
    const query = params.q.toLowerCase().trim()
    items = items.filter((player) => player.name.toLowerCase().includes(query))
  }

  return items
    .map(toPlayerSummary)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function createPlayer(payload: PlayerCreatePayload): Promise<PlayerSummary> {
  await delay()

  const primaryCode = payload.primary_position_id
    ? positionCodeById(payload.primary_position_id)
    : null
  const secondaryCodes = (payload.secondary_position_ids ?? [])
    .map((id) => positionCodeById(id))
    .filter((code): code is PositionKey => Boolean(code))

  const player: InternalPlayer = {
    id: nextPlayerId++,
    name: payload.name,
    status: payload.status ?? 'FIT',
    team_id: payload.team_id,
    current_club_id: payload.current_club_id ?? null,
    primary_position: primaryCode,
    secondary_positions: secondaryCodes,
    overall_rating: payload.overall_rating,
    pace: payload.pace ?? 60,
    passing: payload.passing ?? 60,
    stamina: payload.stamina ?? 60,
    recent_form_index: payload.recent_form_index ?? 60,
    fitness_score: payload.fitness_score ?? 60,
    minutes_last_5: payload.minutes_last_5 ?? 0,
    goal_contribution_rate: payload.goal_contribution_rate ?? 0,
  }

  players = [player, ...players]
  latestSnapshotAt = isoTimestampOffset(0)
  return toPlayerSummary(player)
}

export async function updatePlayer(playerId: number, payload: PlayerUpdatePayload): Promise<PlayerSummary> {
  await delay()
  const player = findPlayer(playerId)

  if (payload.name !== undefined) player.name = payload.name
  if (payload.status !== undefined) player.status = payload.status
  if (payload.team_id !== undefined) player.team_id = payload.team_id
  if (payload.current_club_id !== undefined) player.current_club_id = payload.current_club_id
  if (payload.primary_position_id !== undefined) player.primary_position = positionCodeById(payload.primary_position_id)
  if (payload.secondary_position_ids !== undefined) {
    player.secondary_positions = payload.secondary_position_ids
      .map((id) => positionCodeById(id))
      .filter((code): code is PositionKey => Boolean(code))
  }
  if (payload.overall_rating !== undefined) player.overall_rating = payload.overall_rating
  if (payload.pace !== undefined) player.pace = payload.pace
  if (payload.passing !== undefined) player.passing = payload.passing
  if (payload.stamina !== undefined) player.stamina = payload.stamina
  if (payload.recent_form_index !== undefined) player.recent_form_index = payload.recent_form_index
  if (payload.fitness_score !== undefined) player.fitness_score = payload.fitness_score
  if (payload.minutes_last_5 !== undefined) player.minutes_last_5 = payload.minutes_last_5
  if (payload.goal_contribution_rate !== undefined) player.goal_contribution_rate = payload.goal_contribution_rate

  latestSnapshotAt = isoTimestampOffset(0)
  return toPlayerSummary(player)
}

export async function getPlayerDetail(playerId: number): Promise<PlayerDetail> {
  await delay()
  return toPlayerDetail(findPlayer(playerId))
}

export async function getPlayerHistory(playerId: number, params: PlayerHistoryParams = {}): Promise<PlayerHistoryItem[]> {
  await delay()
  const limit = params.last_n ?? 10

  const generated = historyRows.map((item) => ({
    ...item,
    id: item.id + (playerId * 100),
    rating: round2(Math.max(6, Math.min(9.5, item.rating + ((playerId % 3) * 0.1)))),
    goals: playerId % 2 === 0 ? item.goals : Math.max(0, item.goals - 1),
    assists: playerId % 2 === 1 ? item.assists : Math.max(0, item.assists - 1),
  }))

  return generated.slice(0, limit)
}

export async function getNextMatchInsights(): Promise<NextMatchInsightsResponse> {
  await delay()
  return staticInsights
}

export async function getAdminOverview(): Promise<AdminOverview> {
  await delay()
  return {
    players_total: players.length,
    active_injuries: injuries.filter((injury) => injury.is_active).length,
    active_replacement_decisions: decisions.filter((decision) => decision.is_active).length,
    latest_snapshot_at: latestSnapshotAt,
    data_freshness: 'healthy',
  }
}

export async function recomputeRecommendations(payload: AdminRecomputePayload): Promise<AdminRecomputeResponse> {
  await delay()
  const created = getCandidatesForPosition(payload.position, 10).length
  latestSnapshotAt = isoTimestampOffset(0)
  return {
    created_snapshots: created,
    run_label: payload.run_label ?? 'mock-run',
    clear_existing: payload.clear_existing ?? false,
  }
}

export async function listInjuries(params: InjuryListParams = {}): Promise<InjuryItem[]> {
  await delay()
  let items = [...injuries]
  if (params.active === 'true') {
    items = items.filter((injury) => injury.is_active)
  } else if (params.active === 'false') {
    items = items.filter((injury) => !injury.is_active)
  }
  return items
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map(toInjuryItem)
}

export async function createInjury(payload: InjuryCreatePayload): Promise<InjuryItem> {
  await delay()
  const injury: InternalInjury = {
    id: nextInjuryId++,
    player_id: payload.player_id,
    injury_name: payload.injury_name,
    severity: payload.severity,
    start_date: payload.start_date,
    expected_return_date: payload.expected_return_date ?? null,
    is_active: payload.is_active ?? true,
  }
  injuries = [injury, ...injuries]

  const player = findPlayer(payload.player_id)
  if (injury.is_active) {
    player.status = 'INJ'
  }

  latestSnapshotAt = isoTimestampOffset(0)
  return toInjuryItem(injury)
}

export async function updateInjury(injuryId: number, payload: InjuryUpdatePayload): Promise<InjuryItem> {
  await delay()
  const injury = injuries.find((item) => item.id === injuryId)
  if (!injury) {
    throw new Error(`Injury ${injuryId} was not found in mock dataset.`)
  }

  if (payload.player_id !== undefined) injury.player_id = payload.player_id
  if (payload.injury_name !== undefined) injury.injury_name = payload.injury_name
  if (payload.severity !== undefined) injury.severity = payload.severity
  if (payload.start_date !== undefined) injury.start_date = payload.start_date
  if (payload.expected_return_date !== undefined) injury.expected_return_date = payload.expected_return_date
  if (payload.is_active !== undefined) injury.is_active = payload.is_active

  const affectedPlayer = findPlayer(injury.player_id)
  if (injury.is_active) {
    affectedPlayer.status = 'INJ'
  } else {
    const stillActive = injuries.some((item) => item.player_id === injury.player_id && item.is_active)
    if (!stillActive && affectedPlayer.status === 'INJ') {
      affectedPlayer.status = 'FIT'
    }
  }

  latestSnapshotAt = isoTimestampOffset(0)
  return toInjuryItem(injury)
}

export async function getRosterMetadata(): Promise<RosterMetadata> {
  await delay()
  return {
    positions,
    teams,
    clubs,
  }
}

export async function listPositions(): Promise<PositionRecord[]> {
  await delay()
  return positions
}

export async function getReplacementCandidates(params: ReplacementCandidatesParams): Promise<ReplacementCandidatesPayload> {
  await delay()
  const injured = findPlayer(params.player_id)
  if (!injured.primary_position) {
    return {
      injured_player: {
        id: injured.id,
        name: injured.name,
        position: 'ST',
      },
      items: [],
    }
  }

  const candidates = getCandidatesForPosition(injured.primary_position, params.limit ?? 10, injured.id)
  return {
    injured_player: {
      id: injured.id,
      name: injured.name,
      position: injured.primary_position,
    },
    items: candidates.map((player) => toTopOption(player, injured.primary_position as PositionKey)),
  }
}

export async function listReplacementDecisions(params: ReplacementDecisionListParams = {}): Promise<ReplacementDecision[]> {
  await delay()
  const includeInactive = params.include_inactive ?? false
  return decisions
    .filter((decision) => includeInactive || decision.is_active)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(toDecisionItem)
}

export async function createReplacementDecision(payload: ReplacementDecisionCreatePayload): Promise<ReplacementDecision> {
  await delay()
  const injured = findPlayer(payload.injured_player_id)
  const replacement = findPlayer(payload.replacement_player_id)
  if (replacement.status !== 'FIT') {
    throw new Error('Replacement player must be FIT in workflow decisions.')
  }

  decisions = decisions.map((decision) => {
    if (decision.injured_player_id === injured.id && decision.is_active) {
      return {
        ...decision,
        is_active: false,
        updated_at: isoTimestampOffset(0),
      }
    }
    return decision
  })

  const resolvedPositionId = payload.position_id ?? (injured.primary_position ? positionIdByCode(injured.primary_position) : null)
  const created: InternalDecision = {
    id: nextDecisionId++,
    injured_player_id: injured.id,
    replacement_player_id: replacement.id,
    position_id: resolvedPositionId,
    notes: payload.notes ?? '',
    is_active: payload.is_active ?? true,
    created_at: isoTimestampOffset(0),
    updated_at: isoTimestampOffset(0),
  }

  decisions = [created, ...decisions]
  latestSnapshotAt = isoTimestampOffset(0)
  return toDecisionItem(created)
}

export async function updateReplacementDecision(
  decisionId: number,
  payload: ReplacementDecisionUpdatePayload,
): Promise<ReplacementDecision> {
  await delay()
  const decision = decisions.find((item) => item.id === decisionId)
  if (!decision) {
    throw new Error(`Replacement decision ${decisionId} was not found.`)
  }

  if (payload.replacement_player_id !== undefined) {
    const replacement = findPlayer(payload.replacement_player_id)
    if (replacement.status !== 'FIT') {
      throw new Error('Replacement player must be FIT in workflow decisions.')
    }
    decision.replacement_player_id = replacement.id
  }
  if (payload.position_id !== undefined) decision.position_id = payload.position_id
  if (payload.notes !== undefined) decision.notes = payload.notes
  if (payload.is_active !== undefined) decision.is_active = payload.is_active
  decision.updated_at = isoTimestampOffset(0)

  latestSnapshotAt = isoTimestampOffset(0)
  return toDecisionItem(decision)
}
