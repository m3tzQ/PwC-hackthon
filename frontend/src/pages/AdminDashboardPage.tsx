import { useEffect, useMemo, useState } from 'react'
import {
  createInjury,
  createPlayer,
  getAdminOverview,
  getRosterMetadata,
  listInjuries,
  listPlayers,
  recomputeRecommendations,
  updatePlayer,
} from '../api/teamAnalytics'
import type {
  AdminOverview,
  InjuryItem,
  PlayerFormState,
  PlayerSummary,
  PlayerUpdatePayload,
  PositionKey,
  RosterMetadata,
} from '../types/domain'

const defaultPlayerForm: PlayerFormState = {
  name: '',
  team_id: 0,
  current_club_id: null,
  primary_position_id: null,
  overall_rating: 70,
  status: 'FIT',
  recentForm: 65,
  fitness_score: 70,
  minutes_last_5: 200,
  goal_contribution_rate: 0.2,
}

function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [metadata, setMetadata] = useState<RosterMetadata | null>(null)
  const [players, setPlayers] = useState<PlayerSummary[]>([])
  const [injuries, setInjuries] = useState<InjuryItem[]>([])

  const [playerForm, setPlayerForm] = useState<PlayerFormState>(defaultPlayerForm)
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)
  const [playerUpdateForm, setPlayerUpdateForm] = useState<PlayerUpdatePayload>({ status: 'FIT' })

  const [injuryForm, setInjuryForm] = useState({
    player_id: 0,
    injury_name: '',
    severity: 'moderate',
    start_date: new Date().toISOString().slice(0, 10),
    expected_return_date: '',
  })

  const [recomputeForm, setRecomputeForm] = useState({
    position: 'ST' as PositionKey,
    run_label: 'admin-manual-run',
    clear_existing: true,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sortedPlayers = useMemo(
    () => [...players].sort((a, b) => a.name.localeCompare(b.name)),
    [players],
  )

  const refreshData = async () => {
    const [overviewData, metadataData, playerData, injuryData] = await Promise.all([
      getAdminOverview(),
      getRosterMetadata(),
      listPlayers(),
      listInjuries({ active: 'all' }),
    ])

    setOverview(overviewData)
    setMetadata(metadataData)
    setPlayers(playerData)
    setInjuries(injuryData)

    if (!playerForm.team_id && metadataData.teams.length) {
      setPlayerForm((prev) => ({ ...prev, team_id: metadataData.teams[0].id }))
    }
    if (!playerForm.primary_position_id && metadataData.positions.length) {
      setPlayerForm((prev) => ({ ...prev, primary_position_id: metadataData.positions[0].id }))
    }
    if (!injuryForm.player_id && playerData.length) {
      setInjuryForm((prev) => ({ ...prev, player_id: playerData[0].id }))
    }
  }

  useEffect(() => {
    let mounted = true

    const loadData = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        await refreshData()
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load admin data.')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreatePlayer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!playerForm.team_id || !playerForm.primary_position_id) {
      setErrorMessage('Team and primary position are required to create a player.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setMessage(null)

    try {
      await createPlayer({
        name: playerForm.name,
        team_id: playerForm.team_id,
        current_club_id: playerForm.current_club_id,
        primary_position_id: playerForm.primary_position_id,
        overall_rating: playerForm.overall_rating,
        status: playerForm.status,
        recent_form_index: playerForm.recentForm,
        fitness_score: playerForm.fitness_score,
        minutes_last_5: playerForm.minutes_last_5,
        goal_contribution_rate: playerForm.goal_contribution_rate,
      })

      await refreshData()
      setMessage('Player created successfully.')
      setPlayerForm((prev) => ({ ...defaultPlayerForm, team_id: prev.team_id, primary_position_id: prev.primary_position_id }))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create player.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePlayer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPlayerId) {
      setErrorMessage('Select a player to update.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setMessage(null)

    try {
      await updatePlayer(selectedPlayerId, playerUpdateForm)
      await refreshData()
      setMessage('Player updated successfully.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update player.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateInjury = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!injuryForm.player_id) {
      setErrorMessage('Select a player before creating an injury case.')
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setMessage(null)

    try {
      await createInjury({
        player_id: injuryForm.player_id,
        injury_name: injuryForm.injury_name,
        severity: injuryForm.severity,
        start_date: injuryForm.start_date,
        expected_return_date: injuryForm.expected_return_date || null,
        is_active: true,
      })

      await refreshData()
      setMessage('Injury case created successfully.')
      setInjuryForm((prev) => ({ ...prev, injury_name: '', expected_return_date: '' }))
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create injury case.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRecompute = async () => {
    setIsSaving(true)
    setErrorMessage(null)
    setMessage(null)

    try {
      const response = await recomputeRecommendations(recomputeForm)
      await refreshData()
      setMessage(`Recompute completed. Created ${response.created_snapshots} snapshots.`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to recompute recommendations.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section className="card-surface">
        <p className="section-eyebrow">Admin Control Panel</p>
        <h2>Loading operations console...</h2>
      </section>
    )
  }

  return (
    <div className="page-stack">
      <section className="card-surface">
        <p className="section-eyebrow">Admin Control Panel</p>
        <h2>Quick Access and Operational Stats</h2>
        <p className="section-copy">
          Operations surface for data refresh, ingestion monitoring, injury updates,
          and recommendation recompute actions.
        </p>
        <div className="metric-grid">
          <article className="metric-card">
            <p className="metric-label">Players Total</p>
            <p className="metric-value">{overview?.players_total ?? 0}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Active Injuries</p>
            <p className="metric-value">{overview?.active_injuries ?? 0}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Active Decisions</p>
            <p className="metric-value">{overview?.active_replacement_decisions ?? 0}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Data Freshness</p>
            <p className="metric-value">{overview?.data_freshness ?? 'unknown'}</p>
          </article>
        </div>
        {message ? <p className="success-banner top-gap-sm">{message}</p> : null}
        {errorMessage ? <p className="error-banner top-gap-sm">{errorMessage}</p> : null}
      </section>

      <section className="layout-two-col">
        <article className="card-surface">
          <p className="section-eyebrow">Recommendation Engine</p>
          <h3>Recompute Snapshots</h3>
          <div className="form-grid top-gap-sm">
            <label>
              Position
              <select
                className="position-select top-gap-xs"
                value={recomputeForm.position}
                onChange={(event) => setRecomputeForm((prev) => ({ ...prev, position: event.target.value as PositionKey }))}
              >
                {(metadata?.positions ?? []).map((position) => (
                  <option key={position.id} value={position.code}>{position.code}</option>
                ))}
              </select>
            </label>

            <label>
              Run Label
              <input
                className="form-input top-gap-xs"
                value={recomputeForm.run_label}
                onChange={(event) => setRecomputeForm((prev) => ({ ...prev, run_label: event.target.value }))}
              />
            </label>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={recomputeForm.clear_existing}
                onChange={(event) => setRecomputeForm((prev) => ({ ...prev, clear_existing: event.target.checked }))}
              />
              Clear previous snapshots for this position
            </label>

            <button type="button" className="primary-action" onClick={() => void handleRecompute()} disabled={isSaving}>
              Recompute Recommendations
            </button>
          </div>
        </article>

        <article className="card-surface">
          <p className="section-eyebrow">Update Existing Player</p>
          <h3>Edit Availability and Performance</h3>
          <form className="form-grid top-gap-sm" onSubmit={(event) => void handleUpdatePlayer(event)}>
            <label>
              Player
              <select
                className="position-select top-gap-xs"
                value={selectedPlayerId ?? ''}
                onChange={(event) => setSelectedPlayerId(Number(event.target.value))}
              >
                <option value="" disabled>Select player</option>
                {sortedPlayers.map((player) => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select
                className="position-select top-gap-xs"
                value={playerUpdateForm.status ?? 'FIT'}
                onChange={(event) => setPlayerUpdateForm((prev) => ({ ...prev, status: event.target.value as 'FIT' | 'INJ' | 'SUS' }))}
              >
                <option value="FIT">FIT</option>
                <option value="INJ">INJ</option>
                <option value="SUS">SUS</option>
              </select>
            </label>

            <label>
              Fitness Score
              <input
                className="form-input top-gap-xs"
                type="number"
                min={1}
                max={100}
                value={playerUpdateForm.fitness_score ?? 70}
                onChange={(event) => setPlayerUpdateForm((prev) => ({ ...prev, fitness_score: Number(event.target.value) }))}
              />
            </label>

            <label>
              Recent Form Index
              <input
                className="form-input top-gap-xs"
                type="number"
                min={1}
                max={100}
                value={playerUpdateForm.recent_form_index ?? 70}
                onChange={(event) => setPlayerUpdateForm((prev) => ({ ...prev, recent_form_index: Number(event.target.value) }))}
              />
            </label>

            <button type="submit" className="primary-action" disabled={isSaving}>
              Save Player Update
            </button>
          </form>
        </article>
      </section>

      <section className="layout-two-col">
        <article className="card-surface">
          <p className="section-eyebrow">Create Player</p>
          <h3>Enter New Player Data</h3>
          <form className="form-grid top-gap-sm" onSubmit={(event) => void handleCreatePlayer(event)}>
            <label>
              Name
              <input
                className="form-input top-gap-xs"
                value={playerForm.name}
                onChange={(event) => setPlayerForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>

            <label>
              Team
              <select
                className="position-select top-gap-xs"
                value={playerForm.team_id}
                onChange={(event) => setPlayerForm((prev) => ({ ...prev, team_id: Number(event.target.value) }))}
                required
              >
                {(metadata?.teams ?? []).map((team) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </label>

            <label>
              Club
              <select
                className="position-select top-gap-xs"
                value={playerForm.current_club_id ?? ''}
                onChange={(event) => setPlayerForm((prev) => ({ ...prev, current_club_id: event.target.value ? Number(event.target.value) : null }))}
              >
                <option value="">None</option>
                {(metadata?.clubs ?? []).map((club) => (
                  <option key={club.id} value={club.id}>{club.name}</option>
                ))}
              </select>
            </label>

            <label>
              Primary Position
              <select
                className="position-select top-gap-xs"
                value={playerForm.primary_position_id ?? ''}
                onChange={(event) => setPlayerForm((prev) => ({ ...prev, primary_position_id: Number(event.target.value) }))}
                required
              >
                {(metadata?.positions ?? []).map((position) => (
                  <option key={position.id} value={position.id}>{position.code}</option>
                ))}
              </select>
            </label>

            <label>
              Overall Rating
              <input
                className="form-input top-gap-xs"
                type="number"
                min={1}
                max={100}
                value={playerForm.overall_rating}
                onChange={(event) => setPlayerForm((prev) => ({ ...prev, overall_rating: Number(event.target.value) }))}
              />
            </label>

            <label>
              Fitness Score
              <input
                className="form-input top-gap-xs"
                type="number"
                min={1}
                max={100}
                value={playerForm.fitness_score}
                onChange={(event) => setPlayerForm((prev) => ({ ...prev, fitness_score: Number(event.target.value) }))}
              />
            </label>

            <button type="submit" className="primary-action" disabled={isSaving}>
              Create Player
            </button>
          </form>
        </article>

        <article className="card-surface">
          <p className="section-eyebrow">Create Injury Case</p>
          <h3>Enter New Injury Data</h3>
          <form className="form-grid top-gap-sm" onSubmit={(event) => void handleCreateInjury(event)}>
            <label>
              Player
              <select
                className="position-select top-gap-xs"
                value={injuryForm.player_id}
                onChange={(event) => setInjuryForm((prev) => ({ ...prev, player_id: Number(event.target.value) }))}
              >
                {sortedPlayers.map((player) => (
                  <option key={player.id} value={player.id}>{player.name}</option>
                ))}
              </select>
            </label>

            <label>
              Injury Name
              <input
                className="form-input top-gap-xs"
                value={injuryForm.injury_name}
                onChange={(event) => setInjuryForm((prev) => ({ ...prev, injury_name: event.target.value }))}
                required
              />
            </label>

            <label>
              Severity
              <input
                className="form-input top-gap-xs"
                value={injuryForm.severity}
                onChange={(event) => setInjuryForm((prev) => ({ ...prev, severity: event.target.value }))}
              />
            </label>

            <label>
              Start Date
              <input
                className="form-input top-gap-xs"
                type="date"
                value={injuryForm.start_date}
                onChange={(event) => setInjuryForm((prev) => ({ ...prev, start_date: event.target.value }))}
              />
            </label>

            <label>
              Expected Return
              <input
                className="form-input top-gap-xs"
                type="date"
                value={injuryForm.expected_return_date}
                onChange={(event) => setInjuryForm((prev) => ({ ...prev, expected_return_date: event.target.value }))}
              />
            </label>

            <button type="submit" className="primary-action" disabled={isSaving}>
              Create Injury Case
            </button>
          </form>
        </article>
      </section>

      <section className="card-surface">
        <p className="section-eyebrow">Data Views</p>
        <h3>Current Injury and Player Records</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Status</th>
                <th>Position</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr key={`player-${player.id}`}>
                  <td>Player</td>
                  <td>{player.name}</td>
                  <td>{player.status}</td>
                  <td>{player.primary_position ?? 'N/A'}</td>
                  <td>Fit {Math.round(player.fitness_score)} • Form {Math.round(player.recent_form_index)}</td>
                </tr>
              ))}
              {injuries.map((injury) => (
                <tr key={`injury-${injury.id}`}>
                  <td>Injury</td>
                  <td>{injury.player_name}</td>
                  <td>{injury.is_active ? 'ACTIVE' : 'RESOLVED'}</td>
                  <td>{injury.position ?? 'N/A'}</td>
                  <td>{injury.injury_name} ({injury.severity})</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-surface">
        <p className="section-eyebrow">Data Freshness</p>
        <h3>Ingestion Health</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Latest Snapshot At</td>
                <td>{overview?.latest_snapshot_at ?? 'N/A'}</td>
              </tr>
              <tr>
                <td>Data Freshness</td>
                <td>{overview?.data_freshness ?? 'unknown'}</td>
              </tr>
              <tr>
                <td>Total Players</td>
                <td>{overview?.players_total ?? 0}</td>
              </tr>
              <tr>
                <td>Active Injuries</td>
                <td>{overview?.active_injuries ?? 0}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboardPage
