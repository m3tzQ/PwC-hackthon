import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPlayerDetail, getPlayerHistory } from '../api/teamAnalytics'
import type { PlayerDetail, PlayerHistoryItem } from '../types/domain'

function PlayerHistoryPage() {
  const { playerId } = useParams()
  const parsedId = Number(playerId)
  const activePlayerId = Number.isNaN(parsedId) ? 1 : parsedId
  const [activePlayer, setActivePlayer] = useState<PlayerDetail | null>(null)
  const [historyRows, setHistoryRows] = useState<PlayerHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const [player, history] = await Promise.all([
          getPlayerDetail(activePlayerId),
          getPlayerHistory(activePlayerId, { last_n: 10 }),
        ])

        if (!mounted) return
        setActivePlayer(player)
        setHistoryRows(history)
      } catch (error) {
        if (!mounted) return
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load player history.')
      } finally {
        if (!mounted) return
        setIsLoading(false)
      }
    }

    void loadData()
    return () => {
      mounted = false
    }
  }, [activePlayerId])

  const averageRating = useMemo(() => {
    if (!historyRows.length) return '0.00'
    return (historyRows.reduce((sum, row) => sum + row.rating, 0) / historyRows.length).toFixed(2)
  }, [historyRows])

  const totalContributions = historyRows.reduce(
    (sum, row) => sum + row.goals + row.assists,
    0,
  )

  if (isLoading) {
    return (
      <section className="card-surface">
        <p className="section-eyebrow">Player History</p>
        <h2>Loading match timeline...</h2>
      </section>
    )
  }

  if (errorMessage || !activePlayer) {
    return (
      <section className="card-surface">
        <p className="section-eyebrow">Player History</p>
        <h2>History unavailable</h2>
        <p className="section-copy">{errorMessage ?? 'No data found for this player.'}</p>
        <Link className="primary-action" to="/admin">Open Admin</Link>
      </section>
    )
  }

  return (
    <div className="page-stack">
      <section className="card-surface">
        <p className="section-eyebrow">Player History</p>
        <h2>{activePlayer.name} - Previous Matches and Stats</h2>
        <div className="metric-grid">
          <article className="metric-card">
            <p className="metric-label">Matches Tracked</p>
            <p className="metric-value">{historyRows.length}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Average Rating</p>
            <p className="metric-value">{averageRating}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Goal + Assist</p>
            <p className="metric-value">{totalContributions}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Minutes Last 5</p>
            <p className="metric-value">{activePlayer.minutes_last_5}</p>
          </article>
        </div>
      </section>

      <section className="layout-two-col">
        <article className="card-surface">
          <p className="section-eyebrow">Timeline</p>
          <h3>Recent Match Output</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Min</th>
                  <th>G/A</th>
                  <th>Pass %</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={`${row.id}-${row.match_date}`}> 
                    <td>{row.match_date}</td>
                    <td>{row.opponent}</td>
                    <td>{row.minutes_played}</td>
                    <td>
                      {row.goals}/{row.assists}
                    </td>
                    <td>{Math.round(row.pass_accuracy_percent)}%</td>
                    <td>{row.rating}</td>
                  </tr>
                ))}
                {!historyRows.length ? (
                  <tr>
                    <td colSpan={6} className="muted">No match history entries yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card-surface">
          <p className="section-eyebrow">Form Trend</p>
          <h3>Rating and Duel Trend</h3>
          <div className="spark-grid">
            {historyRows.map((row) => (
              <article key={`${row.id}-${row.opponent}`} className="spark-item">
                <div className="spark-header">
                  <p>{row.opponent}</p>
                  <p className="muted">{row.match_date}</p>
                </div>
                <div className="mini-bars">
                  <div>
                    <p>Rating</p>
                    <span style={{ width: `${(row.rating / 10) * 100}%` }} />
                  </div>
                  <div>
                    <p>Pass Accuracy</p>
                    <span style={{ width: `${Math.min(row.pass_accuracy_percent, 100)}%` }} />
                  </div>
                  <div>
                    <p>Distance Covered</p>
                    <span style={{ width: `${Math.min((row.distance_covered_km / 12) * 100, 100)}%` }} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="card-surface action-row">
        <Link className="action-link" to={`/players/${activePlayer.id}`}>
          Back to Profile
        </Link>
        <Link className="primary-action" to="/matches/next-insights">
          Move to Match Insights
        </Link>
      </section>
    </div>
  )
}

export default PlayerHistoryPage
