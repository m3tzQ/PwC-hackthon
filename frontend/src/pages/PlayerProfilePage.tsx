import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPlayerDetail, listPlayers } from '../api/teamAnalytics'
import type { PlayerDetail, PlayerSummary } from '../types/domain'

function PlayerProfilePage() {
  const { playerId } = useParams()
  const parsedId = Number(playerId)
  const activePlayerId = Number.isNaN(parsedId) ? 1 : parsedId
  const [activePlayer, setActivePlayer] = useState<PlayerDetail | null>(null)
  const [players, setPlayers] = useState<PlayerSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const [detail, allPlayers] = await Promise.all([
          getPlayerDetail(activePlayerId),
          listPlayers(),
        ])

        if (mounted) {
          setActivePlayer(detail)
          setPlayers(allPlayers)
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load player profile.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()
    return () => {
      mounted = false
    }
  }, [activePlayerId])

  const skillRows = useMemo(() => {
    if (!activePlayer) return []
    return [
      { key: 'Pace', value: activePlayer.pace },
      { key: 'Passing', value: activePlayer.passing },
      { key: 'Stamina', value: activePlayer.stamina },
      { key: 'Form', value: Math.round(activePlayer.recent_form_index) },
      { key: 'Fitness', value: Math.round(activePlayer.fitness_score) },
      { key: 'Overall', value: activePlayer.overall_rating },
    ]
  }, [activePlayer])

  if (isLoading) {
    return (
      <section className="card-surface">
        <p className="section-eyebrow">Player Profile</p>
        <h2>Loading profile...</h2>
      </section>
    )
  }

  if (errorMessage || !activePlayer) {
    return (
      <section className="card-surface">
        <p className="section-eyebrow">Player Profile</p>
        <h2>Profile unavailable</h2>
        <p className="section-copy">{errorMessage ?? 'Unable to load player.'}</p>
        <Link className="primary-action" to="/admin">Open Admin</Link>
      </section>
    )
  }

  return (
    <div className="page-stack">
      <section className="card-surface profile-hero">
        <p className="section-eyebrow">Player Profile</p>
        <h2>{activePlayer.name}</h2>
        <p className="section-copy">
          {activePlayer.team_name} tactical profile. Current availability status: {activePlayer.status}.
        </p>
        <div className="profile-quick-metrics">
          <article>
            <p className="muted">Club</p>
            <p>{activePlayer.current_club_name ?? 'Unknown'}</p>
          </article>
          <article>
            <p className="muted">Team</p>
            <p>{activePlayer.team_name}</p>
          </article>
          <article>
            <p className="muted">Primary Position</p>
            <p>{activePlayer.primary_position ?? 'Unassigned'}</p>
          </article>
          <article>
            <p className="muted">Recommendation Score</p>
            <p>{Math.round(activePlayer.suitability_score)}</p>
          </article>
        </div>
      </section>

      <section className="layout-two-col">
        <article className="card-surface">
          <p className="section-eyebrow">Skill Breakdown</p>
          <h3>Role Compatibility Metrics</h3>
          <div className="skill-bars">
            {skillRows.map((row) => (
              <div key={row.key}>
                <div className="skill-header">
                  <span>{row.key}</span>
                  <span>{row.value}</span>
                </div>
                <div className="progress-rail">
                  <span className="progress-fill" style={{ width: `${row.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="tag-wrap">
            {activePlayer.strengths.map((tag) => (
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
                  {player.primary_position ?? 'N/A'} • Score {Math.round(player.suitability_score)}
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
