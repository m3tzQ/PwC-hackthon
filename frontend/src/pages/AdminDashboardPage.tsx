import { adminKpis, ingestionLogs } from '../data/mockData'

function AdminDashboardPage() {
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
          {adminKpis.map((kpi) => (
            <article key={kpi.label} className="metric-card">
              <p className="metric-label">{kpi.label}</p>
              <p className="metric-value">{kpi.value}</p>
              <p className="metric-hint">{kpi.change}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="layout-two-col">
        <article className="card-surface">
          <p className="section-eyebrow">Quick Actions</p>
          <h3>Admin Shortcuts</h3>
          <div className="admin-action-grid">
            <button type="button" className="ghost-button">
              Recompute Recommendations
            </button>
            <button type="button" className="ghost-button">
              Sync Match Data
            </button>
            <button type="button" className="ghost-button">
              Open Injury Editor
            </button>
            <button type="button" className="ghost-button">
              Export Coach Brief
            </button>
          </div>
        </article>

        <article className="card-surface">
          <p className="section-eyebrow">Data Freshness</p>
          <h3>Ingestion Health</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Records</th>
                </tr>
              </thead>
              <tbody>
                {ingestionLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.id}</td>
                    <td>{log.source}</td>
                    <td>
                      <span
                        className={`status-pill status-${log.status.toLowerCase()}`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td>{log.updatedAt}</td>
                    <td>{log.records}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  )
}

export default AdminDashboardPage
