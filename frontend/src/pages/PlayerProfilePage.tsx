import { Link, useParams } from 'react-router-dom'
import { getPlayerById, players } from '../data/mockData'

function PlayerProfilePage() {
  const { playerId } = useParams()
  const parsedId = Number(playerId)
  const activePlayer = getPlayerById(Number.isNaN(parsedId) ? 3 : parsedId) ?? players[0]

  return (
    <div className="page-stack">
      <section className="card-surface profile-hero">
        <p className="section-eyebrow">Player Profile</p>
        <h2>{activePlayer.name}</h2>
        <p className="section-copy">{activePlayer.overview}</p>
        <div className="profile-quick-metrics">
          <article>
            <p className="muted">Club</p>
            <p>{activePlayer.club}</p>
          </article>
          <article>
            <p className="muted">Age</p>
            <p>{activePlayer.age}</p>
          </article>
          <article>
            <p className="muted">Primary Position</p>
            <p>{activePlayer.primaryPosition}</p>
          </article>
          <article>
            <p className="muted">Recommendation Score</p>
            <p>{activePlayer.recommendationScore}</p>
          </article>
        </div>
      </section>

      <section className="layout-two-col">
        <article className="card-surface">
          <p className="section-eyebrow">Skill Breakdown</p>
          <h3>Role Compatibility Metrics</h3>
          <div className="skill-bars">
            {Object.entries(activePlayer.skills).map(([key, value]) => (
              <div key={key}>
                <div className="skill-header">
                  <span>{key}</span>
                  <span>{value}</span>
                </div>
                <div className="progress-rail">
                  <span className="progress-fill" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="tag-wrap">
            {activePlayer.styleTags.map((tag) => (
              <span key={tag} className="tag-pill">
                {tag}
              </span>
            ))}
          </div>
        </article>

        <article className="card-surface">
          <p className="section-eyebrow">Squad Navigation</p>
          <h3>Compare Another Player</h3>
          <div className="player-list">
            {players.map((player) => (
              <Link
                key={player.id}
                className={`list-link ${player.id === activePlayer.id ? 'list-link-active' : ''}`}
                to={`/players/${player.id}`}
              >
                <span>{player.name}</span>
                <span className="muted">
                  {player.primaryPosition} • Score {player.recommendationScore}
                </span>
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="card-surface">
        <p className="section-eyebrow">Next Step</p>
        <h3>Historical Evidence</h3>
        <p className="section-copy">
          Review previous match output before final lineup decisions.
        </p>
        <Link className="primary-action" to={`/players/${activePlayer.id}/history`}>
          Open Match History
        </Link>
      </section>
    </div>
  )
}

export default PlayerProfilePage
