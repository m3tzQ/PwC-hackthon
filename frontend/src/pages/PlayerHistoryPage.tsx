import { Link, useParams } from 'react-router-dom'
import { getHistoryByPlayer, getPlayerById, players } from '../data/mockData'

function PlayerHistoryPage() {
  const { playerId } = useParams()
  const parsedId = Number(playerId)
  const activePlayer = getPlayerById(Number.isNaN(parsedId) ? 3 : parsedId) ?? players[0]

  const historyRows = getHistoryByPlayer(activePlayer.id)
  const averageRating =
    historyRows.length > 0
      ? (historyRows.reduce((sum, row) => sum + row.rating, 0) / historyRows.length).toFixed(2)
      : '0.00'

  const totalContributions = historyRows.reduce(
    (sum, row) => sum + row.goals + row.assists,
    0,
  )

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
            <p className="metric-value">{activePlayer.minutesLast5}</p>
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
                  <th>Comp</th>
                  <th>Result</th>
                  <th>Min</th>
                  <th>G/A</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((row) => (
                  <tr key={`${row.playerId}-${row.date}-${row.opponent}`}>
                    <td>{row.date}</td>
                    <td>{row.opponent}</td>
                    <td>{row.competition}</td>
                    <td>{row.result}</td>
                    <td>{row.minutes}</td>
                    <td>
                      {row.goals}/{row.assists}
                    </td>
                    <td>{row.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card-surface">
          <p className="section-eyebrow">Form Trend</p>
          <h3>Rating and Duel Trend</h3>
          <div className="spark-grid">
            {historyRows.map((row) => (
              <article key={`${row.date}-${row.opponent}`} className="spark-item">
                <div className="spark-header">
                  <p>{row.opponent}</p>
                  <p className="muted">{row.date}</p>
                </div>
                <div className="mini-bars">
                  <div>
                    <p>Rating</p>
                    <span style={{ width: `${(row.rating / 10) * 100}%` }} />
                  </div>
                  <div>
                    <p>Duels Won</p>
                    <span style={{ width: `${Math.min((row.duelsWon / 10) * 100, 100)}%` }} />
                  </div>
                  <div>
                    <p>Key Passes</p>
                    <span style={{ width: `${Math.min((row.keyPasses / 5) * 100, 100)}%` }} />
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
