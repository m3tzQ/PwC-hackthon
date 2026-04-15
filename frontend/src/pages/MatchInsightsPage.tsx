import { getPlayerById, getTopOptionsByPosition, upcomingOpponent } from '../data/mockData'
import type { PositionKey } from '../types/domain'

const formationOrder: PositionKey[] = [
  'GK',
  'RB',
  'CB',
  'LB',
  'DM',
  'CM',
  'AM',
  'RW',
  'LW',
  'ST',
]

function MatchInsightsPage() {
  const lineup = formationOrder
    .map((position) => {
      const best = getTopOptionsByPosition(position, 1)[0]
      return {
        position,
        player: best,
      }
    })
    .filter((entry) => Boolean(entry.player))

  const projectedThreat = Math.round(
    lineup.reduce((sum, entry) => sum + (entry.player?.recommendationScore ?? 0), 0) /
      Math.max(lineup.length, 1),
  )

  const projectedStability = Math.round(
    lineup.reduce((sum, entry) => sum + (entry.player?.fitnessScore ?? 0), 0) /
      Math.max(lineup.length, 1),
  )

  const bestCreator = getPlayerById(3)

  return (
    <div className="page-stack">
      <section className="card-surface">
        <p className="section-eyebrow">Match Insights</p>
        <h2>Jordan vs {upcomingOpponent.opponentName} Tactical Read</h2>
        <div className="metric-grid">
          <article className="metric-card">
            <p className="metric-label">Opponent FIFA Rank</p>
            <p className="metric-value">#{upcomingOpponent.fifaRank}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Preferred Shape</p>
            <p className="metric-value">{upcomingOpponent.preferredFormation}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Attack Threat Index</p>
            <p className="metric-value">{projectedThreat}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Lineup Fitness Index</p>
            <p className="metric-value">{projectedStability}</p>
          </article>
        </div>
      </section>

      <section className="layout-two-col">
        <article className="card-surface">
          <p className="section-eyebrow">Opponent Profile</p>
          <h3>Strengths and Vulnerabilities</h3>
          <div className="insight-columns">
            <div>
              <h4>Strengths</h4>
              <ul>
                {upcomingOpponent.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Vulnerabilities</h4>
              <ul>
                {upcomingOpponent.vulnerabilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <h4>Key Threats</h4>
          <div className="tag-wrap">
            {upcomingOpponent.keyThreats.map((threat) => (
              <span className="tag-pill" key={threat}>
                {threat}
              </span>
            ))}
          </div>
        </article>

        <article className="card-surface">
          <p className="section-eyebrow">Recommended XI Snapshot</p>
          <h3>Best Available by Role</h3>
          <div className="lineup-list">
            {lineup.map((entry) => (
              <article key={entry.position} className="lineup-item">
                <p className="lineup-pos">{entry.position}</p>
                <div>
                  <p>{entry.player?.name}</p>
                  <p className="muted">
                    Score {entry.player?.recommendationScore} • Fitness {entry.player?.fitnessScore}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="card-surface">
        <p className="section-eyebrow">Coaching Notes</p>
        <h3>Suggested Strategy Plan</h3>
        <div className="notes-grid">
          {upcomingOpponent.strategyNotes.map((note) => (
            <article key={note} className="note-card">
              <p>{note}</p>
            </article>
          ))}
          <article className="note-card">
            <p>
              Prioritize right-side creation through {bestCreator?.name}. Trigger overloads
              only after winning second balls in midfield.
            </p>
          </article>
        </div>
      </section>
    </div>
  )
}

export default MatchInsightsPage
