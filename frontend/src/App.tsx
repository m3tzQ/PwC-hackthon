import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import TopNav from './components/TopNav'
import AdminDashboardPage from './pages/AdminDashboardPage'
import DashboardPage from './pages/DashboardPage'
import MatchInsightsPage from './pages/MatchInsightsPage'
import NotFoundPage from './pages/NotFoundPage'
import PlayerHistoryPage from './pages/PlayerHistoryPage'
import PlayerProfilePage from './pages/PlayerProfilePage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <TopNav />
        <main className="page-main">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/players" element={<Navigate to="/players/1" replace />} />
            <Route path="/players/:playerId" element={<PlayerProfilePage />} />
            <Route path="/players/:playerId/history" element={<PlayerHistoryPage />} />
            <Route path="/matches/next-insights" element={<MatchInsightsPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <p>Jordan World Cup 2026 MVP - Data-driven coaching support</p>
        </footer>
      </div>
    </BrowserRouter>
  )
}

export default App
