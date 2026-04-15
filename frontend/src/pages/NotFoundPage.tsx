import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="card-surface not-found">
      <p className="section-eyebrow">404</p>
      <h2>Page not found</h2>
      <p className="section-copy">
        The route you requested does not exist in this MVP navigation map.
      </p>
      <Link className="primary-action" to="/">
        Back to Dashboard
      </Link>
    </section>
  )
}

export default NotFoundPage
