import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/players/3', label: 'Player Profile' },
  { to: '/players/3/history', label: 'Player History' },
  { to: '/matches/next-insights', label: 'Match Insights' },
  { to: '/admin', label: 'Admin' },
]

function TopNav() {
  return (
    <header className="top-nav">
      <div className="brand-wrap">
        <p className="brand-kicker">Jordan 2026</p>
        <h1 className="brand-title">Sakkr Insight Hub</h1>
      </div>
      <nav className="nav-links" aria-label="Primary">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }: { isActive: boolean }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}

export default TopNav
