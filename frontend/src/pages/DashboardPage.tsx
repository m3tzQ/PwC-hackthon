import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import FieldBoard from '../components/FieldBoard'
import MetricCard from '../components/MetricCard'
import {
  getTopOptionsByPosition,
  getTopReplacementCandidates,
  injuryAlerts,
  players,
  positionPriorityMap,
} from '../data/mockData'
import type { Player, PositionKey } from '../types/domain'

const positionOptions = Object.keys(positionPriorityMap) as PositionKey[]

function DashboardPage() {
  const [selectedPosition, setSelectedPosition] = useState<PositionKey>('ST')

  const lineup = useMemo(() => {
    const map: Partial<Record<PositionKey, Player>> = {}

    positionOptions.forEach((position) => {
      const top = getTopOptionsByPosition(position, 1)[0]
      if (top) {
        map[position] = top
      }
    })

    return map
  }, [])

  const topTen = getTopReplacementCandidates(10)
  const selectedPositionTop = getTopOptionsByPosition(selectedPosition, 3)
  const fitPlayers = players.filter((player) => player.availability === 'Fit').length

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
          <MetricCard label="Available Squad" value={`${fitPlayers}/${players.length}`} hint="Players currently fit" />
          <MetricCard label="Injury Alerts" value={`${injuryAlerts.length}`} hint="Key players under watch" />
          <MetricCard label="Top Score" value={`${topTen[0]?.recommendationScore ?? 0}`} hint="Highest recommendation index" />
          <MetricCard label="Tracked Positions" value={`${positionOptions.length}`} hint="Coverage in dashboard" />
        </div>
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
            <article key={alert.playerName} className="injury-alert">
              <p className={`status-pill status-${alert.severity.toLowerCase()}`}>
                {alert.severity} priority
              </p>
              <h4>{alert.playerName}</h4>
              <p>{alert.issue}</p>
              <p className="muted">Expected return: {alert.expectedReturn}</p>
            </article>
          ))}
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
          <FieldBoard lineup={lineup} />
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
          <div className="rank-list">
            {selectedPositionTop.map((player, index) => (
              <article key={player.id} className="rank-item">
                <p className="rank-number">#{index + 1}</p>
                <div>
                  <h4>{player.name}</h4>
                  <p className="muted">
                    {player.club} • Form {player.recentForm} • Fitness {player.fitnessScore}
                  </p>
                </div>
                <Link className="action-link" to={`/players/${player.id}`}>
                  Profile
                </Link>
              </article>
            ))}
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
                <th>Primary Position</th>
                <th>Recommendation</th>
                <th>Availability</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {topTen.map((player, index) => (
                <tr key={player.id}>
                  <td>{index + 1}</td>
                  <td>{player.name}</td>
                  <td>{player.primaryPosition}</td>
                  <td>{player.recommendationScore}</td>
                  <td>{player.availability}</td>
                  <td>
                    <Link className="action-link" to={`/players/${player.id}/history`}>
                      History
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default DashboardPage
