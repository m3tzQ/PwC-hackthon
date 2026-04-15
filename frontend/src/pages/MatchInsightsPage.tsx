import { useEffect, useMemo, useState } from 'react'
import {
  createReplacementDecision,
  getDashboardLineupBoard,
  getNextMatchInsights,
  getReplacementCandidates,
  listInjuries,
  listReplacementDecisions,
  updateReplacementDecision,
} from '../api/teamAnalytics'
import type {
  InjuryItem,
  LineupBoardItem,
  MatchLineupScenario,
  MatchInsightsData,
  NextMatchInsightsResponse,
  ReplacementDecision,
  TopOption,
} from '../types/domain.ts'

function MatchInsightsPage() {
  const [insightsPayload, setInsightsPayload] = useState<NextMatchInsightsResponse | null>(null)
  const [lineup, setLineup] = useState<LineupBoardItem[]>([])
  const [injuries, setInjuries] = useState<InjuryItem[]>([])
  const [decisions, setDecisions] = useState<ReplacementDecision[]>([])
  const [selectedInjuryId, setSelectedInjuryId] = useState<number | null>(null)
  const [candidates, setCandidates] = useState<TopOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [workflowNote, setWorkflowNote] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const insights = useMemo(() => {
    if (!insightsPayload) return null
    if ('match' in insightsPayload) return null
    return insightsPayload as MatchInsightsData
  }, [insightsPayload])

  const selectedInjury = useMemo(
    () => injuries.find((item) => item.player_id === selectedInjuryId) ?? null,
    [injuries, selectedInjuryId],
  )

  const projectedThreat = useMemo(() => {
    if (!candidates.length) return 0
    return Math.round(candidates.reduce((sum, candidate) => sum + candidate.rank_score, 0) / candidates.length)
  }, [candidates])

  const projectedStability = useMemo(() => {
    if (!lineup.length) return 0
    return Math.round(lineup.reduce((sum, player) => sum + player.fitness_score, 0) / lineup.length)
  }, [lineup])

  useEffect(() => {
    let mounted = true

    const loadInitial = async () => {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const [nextInsights, lineupData, injuryData, decisionData] = await Promise.all([
          getNextMatchInsights(),
          getDashboardLineupBoard(),
          listInjuries({ active: 'true' }),
          listReplacementDecisions(),
        ])

        if (mounted) {
          setInsightsPayload(nextInsights)
          setLineup(lineupData)
          setInjuries(injuryData)
          setDecisions(decisionData)
          setSelectedInjuryId(injuryData[0]?.player_id ?? null)
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load match insights.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitial()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedInjuryId) {
      setCandidates([])
      return
    }

    let mounted = true
    const loadCandidates = async () => {
      try {
        const payload = await getReplacementCandidates({ player_id: selectedInjuryId, limit: 6 })
        if (!mounted) return
        setCandidates(payload.items)
      } catch {
        if (!mounted) return
        setCandidates([])
      }
    }

    void loadCandidates()
    return () => {
      mounted = false
    }
  }, [selectedInjuryId])

  const handleSaveDecision = async (candidate: TopOption) => {
    if (!selectedInjuryId) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await createReplacementDecision({
        injured_player_id: selectedInjuryId,
        replacement_player_id: candidate.player_id,
        notes: workflowNote.trim() || `Match insights recommendation for ${candidate.position}`,
        is_active: true,
      })

      const [decisionData, lineupData] = await Promise.all([
        listReplacementDecisions(),
        getDashboardLineupBoard(),
      ])
      setDecisions(decisionData)
      setLineup(lineupData)
      setWorkflowNote('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save replacement decision.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivateDecision = async (decisionId: number) => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await updateReplacementDecision(decisionId, { is_active: false })
      const [decisionData, lineupData] = await Promise.all([
        listReplacementDecisions(),
        getDashboardLineupBoard(),
      ])
      setDecisions(decisionData)
      setLineup(lineupData)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update replacement decision.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section className="card-surface">
        <p className="section-eyebrow">Match Insights</p>
        <h2>Loading tactical profile...</h2>
      </section>
    )
  }

  return (
    <div className="page-stack">
      <section className="card-surface">
        <p className="section-eyebrow">Match Insights</p>
        <h2>
          {insights
            ? `Jordan vs ${insights.opponent} Tactical Read`
            : 'No upcoming match data available'}
        </h2>
        <div className="metric-grid">
          <article className="metric-card">
            <p className="metric-label">Opponent Tactical Style</p>
            <p className="metric-value">{insights?.opponent_tactical_style ?? 'Unknown'}</p>
          </article>
          <article className="metric-card">
            <p className="metric-label">Active Injury Cases</p>
            <p className="metric-value">{injuries.length}</p>
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
        {errorMessage ? <p className="error-banner top-gap-sm">{errorMessage}</p> : null}
      </section>

      <section className="layout-two-col">
        <article className="card-surface">
          <p className="section-eyebrow">Opponent Profile</p>
          <h3>Strengths and Vulnerabilities</h3>
          <div className="insight-columns">
            <div>
              <h4>Strengths</h4>
              <ul>
                {(insights?.tactical_strengths ?? []).map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Vulnerabilities</h4>
              <ul>
                {(insights?.tactical_weaknesses ?? []).map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </article>

        <article className="card-surface">
          <p className="section-eyebrow">Recommended XI Snapshot</p>
          <h3>Best Available by Role</h3>
          <div className="lineup-list">
            {lineup.map((entry) => (
              <article key={`${entry.position}-${entry.player_id ?? 0}`} className="lineup-item">
                <p className="lineup-pos">{entry.position}</p>
                <div>
                  <p>{entry.player_name}</p>
                  <p className="muted">
                    Source {entry.source.toUpperCase()} • Fitness {Math.round(entry.fitness_score)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="card-surface">
        <p className="section-eyebrow">Replacement Workflow</p>
        <h3>Injury to Replacement Selection</h3>

        <div className="workflow-grid top-gap-sm">
          <div>
            <label className="muted" htmlFor="injury-select">Injured Player</label>
            <select
              id="injury-select"
              className="position-select top-gap-xs"
              value={selectedInjuryId ?? ''}
              onChange={(event) => setSelectedInjuryId(Number(event.target.value))}
            >
              <option value="" disabled>Select injured player</option>
              {injuries.map((injury) => (
                <option key={injury.id} value={injury.player_id}>
                  {injury.player_name} ({injury.position ?? 'N/A'})
                </option>
              ))}
            </select>
            {selectedInjury ? (
              <p className="muted top-gap-xs">
                {selectedInjury.injury_name} • return {selectedInjury.expected_return_date ?? 'TBD'}
              </p>
            ) : null}

            <label className="muted top-gap-sm" htmlFor="workflow-note">Decision Note</label>
            <textarea
              id="workflow-note"
              className="workflow-textarea top-gap-xs"
              value={workflowNote}
              onChange={(event) => setWorkflowNote(event.target.value)}
              placeholder="Why this replacement fits the game plan"
            />
          </div>

          <div>
            <h4>Candidate Replacements</h4>
            <div className="rank-list top-gap-xs">
              {candidates.map((candidate) => (
                <article key={`${candidate.player_id}-${candidate.position}`} className="rank-item">
                  <p className="rank-number">{candidate.position}</p>
                  <div>
                    <h4>{candidate.player_name}</h4>
                    <p className="muted">
                      Score {Math.round(candidate.rank_score)} • Confidence {Math.round(candidate.confidence * 100)}%
                    </p>
                  </div>
                  <button
                    type="button"
                    className="action-link button-link"
                    onClick={() => void handleSaveDecision(candidate)}
                    disabled={isSubmitting || !selectedInjuryId}
                  >
                    Select
                  </button>
                </article>
              ))}
              {!candidates.length ? <p className="muted">No candidates available for this injury case.</p> : null}
            </div>
          </div>
        </div>

        <h4 className="top-gap-md">Active Decisions</h4>
        <div className="rank-list top-gap-xs">
          {decisions.map((decision) => (
            <article key={decision.id} className="rank-item">
              <p className="rank-number">{decision.position ?? 'N/A'}</p>
              <div>
                <h4>{decision.injured_player_name} to {decision.replacement_player_name}</h4>
                <p className="muted">{decision.notes || 'No notes'}</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => void handleDeactivateDecision(decision.id)}
                disabled={isSubmitting}
              >
                Deactivate
              </button>
            </article>
          ))}
          {!decisions.length ? <p className="muted">No active replacement decisions yet.</p> : null}
        </div>
      </section>

      <section className="card-surface">
        <p className="section-eyebrow">Coaching Notes</p>
        <h3>Suggested Strategy Plan</h3>
        <div className="notes-grid">
          {(insights?.lineup_scenarios ?? []).map((scenario: MatchLineupScenario) => (
            <article key={scenario.label} className="note-card">
              <p>
                <strong>{scenario.label}:</strong> {scenario.focus}
              </p>
            </article>
          ))}
          {!insights?.lineup_scenarios?.length ? (
            <article className="note-card">
              <p>Lineup scenarios will appear once match intelligence is available.</p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default MatchInsightsPage
