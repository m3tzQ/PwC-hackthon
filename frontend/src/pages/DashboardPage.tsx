import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import FieldBoard from '../components/FieldBoard'
import MetricCard from '../components/MetricCard'
import {
  getDashboardInjuries,
  getDashboardLineupBoard,
  getDashboardTopOptions,
  getOpponentSummary,
  getReplacementSummary,
} from '../api/teamAnalytics'
import type {
  InjuryItem,
  LineupBoardItem,
  OpponentSummary,
  PositionKey,
  PositionSelectionState,
  ReplacementSummary,
  TopOption,
} from '../types/domain'

const positionOptions: PositionKey[] = ['GK', 'RB', 'CB', 'LB', 'DM', 'CM', 'AM', 'RW', 'LW', 'ST']

function severityToBadgeClass(severity: string): 'high' | 'medium' | 'low' {
  const normalized = severity.toLowerCase()
  if (normalized.includes('high') || normalized.includes('major')) return 'high'
  if (normalized.includes('low') || normalized.includes('minor')) return 'low'
  return 'medium'
}

function DashboardPage() {
  const [selectedPosition, setSelectedPosition] = useState<PositionKey>('ST')
  const [summary, setSummary] = useState<ReplacementSummary | null>(null)
  const [injuryAlerts, setInjuryAlerts] = useState<InjuryItem[]>([])
  const [opponent, setOpponent] = useState<OpponentSummary | null>(null)
  const [lineup, setLineup] = useState<LineupBoardItem[]>([])
  const [selectedPositionTop, setSelectedPositionTop] = useState<TopOption[]>([])
  const [topTen, setTopTen] = useState<TopOption[]>([])
  const [manualSelections, setManualSelections] = useState<PositionSelectionState>({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fetchTopTen = useCallback(async () => {
    const perPosition = await Promise.all(
      positionOptions.map((position) =>
        getDashboardTopOptions({ position, limit: 4 }).catch(() => []),
      ),
    )
    const merged = perPosition.flat()
    const deduped = new Map<number, TopOption>()
    merged.forEach((item) => {
      const existing = deduped.get(item.player_id)
      if (!existing || existing.rank_score < item.rank_score) {
        deduped.set(item.player_id, item)
      }
    })

    return Array.from(deduped.values())
      .sort((a, b) => b.rank_score - a.rank_score)
      .slice(0, 10)
  }, [])

  const refreshDashboard = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const [summaryData, injuries, opponentData, lineupData, selectedTop, overallTop] = await Promise.all([
        getReplacementSummary(),
        getDashboardInjuries(),
        getOpponentSummary(),
        getDashboardLineupBoard(),
        getDashboardTopOptions({ position: selectedPosition, limit: 6 }),
        fetchTopTen(),
      ])

      setSummary(summaryData)
      setInjuryAlerts(injuries)
      setOpponent(opponentData)
      setLineup(lineupData)
      setSelectedPositionTop(selectedTop)
      setTopTen(overallTop)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load dashboard data.')
    } finally {
      setIsLoading(false)
    }
  }, [fetchTopTen, selectedPosition])

  const setSelectionForPosition = useCallback((position: PositionKey, option: TopOption) => {
    setManualSelections((prev) => ({ ...prev, [position]: option }))
  }, [])

  const clearSelectionForPosition = useCallback((position: PositionKey) => {
    setManualSelections((prev) => {
      const next = { ...prev }
      delete next[position]
      return next
    })
  }, [])

  const activeLineup = useMemo(() => {
    const lineupMap = new Map<PositionKey, LineupBoardItem>()
    lineup.forEach((item) => lineupMap.set(item.position, item))

    Object.entries(manualSelections).forEach(([position, item]) => {
      lineupMap.set(position as PositionKey, {
        position: position as PositionKey,
        player_id: item.player_id,
        player_name: item.player_name,
        fitness_score: Math.max(1, Math.round(item.confidence * 100)),
        source: 'live',
        decision_id: null,
        injured_player_name: null,
      })
    })

    return Array.from(lineupMap.values())
  }, [lineup, manualSelections])

  const selectedPositionCurrentChoice = manualSelections[selectedPosition]

  useEffect(() => {
    void refreshDashboard()
  }, [refreshDashboard])

  return (
    <div className="page-stack">
      <section className="hero-banner card-surface">
        <p className="section-eyebrow">Coach Intelligence Dashboard</p>
        <h2>Top 10 Replacement Options by Position</h2>
        <p className="section-copy">
          Injury pressure is high. The panel ranks options by form, fitness,
          opponent fit, and tactical role compatibility.
        </p>
        <div className="metric-grid">
          <MetricCard
            label="Available Squad"
            value={`${summary?.fit_count ?? 0}/${(summary?.fit_count ?? 0) + (summary?.injured_count ?? 0)}`}
            hint="Players currently fit"
          />
          <MetricCard label="Injury Alerts" value={`${injuryAlerts.length}`} hint="Key players under watch" />
          <MetricCard label="Top Score" value={`${Math.round(topTen[0]?.rank_score ?? 0)}`} hint="Highest recommendation index" />
          <MetricCard label="Tracked Positions" value={`${positionOptions.length}`} hint="Coverage in dashboard" />
        </div>
        {opponent?.opponent ? (
          <p className="section-copy top-gap-sm">
            Upcoming tactical lens: {opponent.opponent} - {opponent.tactical_style}
          </p>
        ) : null}
        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
      </section>

      <section className="card-surface">
        <div className="section-headline-row">
          <div>
            <p className="section-eyebrow">Injury Watch</p>
            <h3>Critical Availability Updates</h3>
          </div>
        </div>
        <div className="alert-grid">
          {injuryAlerts.map((alert) => (
            <article key={alert.id} className="injury-alert">
              <p className={`status-pill status-${severityToBadgeClass(alert.severity)}`}>
                {alert.severity} priority
              </p>
              <h4>{alert.player_name}</h4>
              <p>{alert.injury_name}</p>
              <p className="muted">Expected return: {alert.expected_return_date ?? 'Unknown'}</p>
            </article>
          ))}
          {!injuryAlerts.length ? <p className="muted">No active injuries recorded.</p> : null}
        </div>
      </section>

      <section className="layout-two-col">
        <article className="card-surface">
          <div className="section-headline-row">
            <div>
              <p className="section-eyebrow">Field Visual</p>
              <h3>Best Options on the Pitch</h3>
            </div>
          </div>
          <FieldBoard
            lineup={activeLineup}
            selectedPosition={selectedPosition}
            onSelectPosition={setSelectedPosition}
          />
        </article>

        <article className="card-surface">
          <div className="section-headline-row">
            <div>
              <p className="section-eyebrow">Position Lens</p>
              <h3>Focused Role Comparison</h3>
            </div>
            <select
              className="position-select"
              value={selectedPosition}
              onChange={(event) => setSelectedPosition(event.target.value as PositionKey)}
              aria-label="Select position"
            >
              {positionOptions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>
          {selectedPositionCurrentChoice ? (
            <div className="inline-action-row">
              <p className="muted">
                Manual override: {selectedPositionCurrentChoice.player_name} ({selectedPositionCurrentChoice.position})
              </p>
              <button
                type="button"
                className="ghost-button"
                onClick={() => clearSelectionForPosition(selectedPosition)}
              >
                Clear Override
              </button>
            </div>
          ) : null}
          <div className="rank-list">
            {selectedPositionTop.map((player, index) => (
              <article key={`${player.player_id}-${player.position}-${index}`} className="rank-item">
                <p className="rank-number">#{index + 1}</p>
                <div>
                  <h4>{player.player_name}</h4>
                  <p className="muted">
                    Score {Math.round(player.rank_score)} • Confidence {Math.round(player.confidence * 100)}%
                  </p>
                </div>
                <div className="inline-link-row">
                  <button
                    type="button"
                    className="action-link button-link"
                    onClick={() => setSelectionForPosition(selectedPosition, player)}
                  >
                    Set on Map
                  </button>
                  <Link className="action-link" to={`/players/${player.player_id}`}>
                    Profile
                  </Link>
                </div>
              </article>
            ))}
            {!selectedPositionTop.length ? <p className="muted">No candidates for this position yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="card-surface">
        <div className="section-headline-row">
          <div>
            <p className="section-eyebrow">Top 10 Board</p>
            <h3>Best Overall Replacements</h3>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Position</th>
                <th>Recommendation</th>
                <th>Confidence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {topTen.map((player, index) => (
                <tr key={`${player.player_id}-${player.position}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{player.player_name}</td>
                  <td>{player.position}</td>
                  <td>{Math.round(player.rank_score)}</td>
                  <td>{Math.round(player.confidence * 100)}%</td>
                  <td>
                    <Link className="action-link" to={`/players/${player.player_id}/history`}>
                      History
                    </Link>
                  </td>
                </tr>
              ))}
              {!topTen.length && !isLoading ? (
                <tr>
                  <td colSpan={6} className="muted">No recommendation snapshots available.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
