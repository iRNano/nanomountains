import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MountainPage from './pages/MountainPage'
import PlanPage from './pages/PlanPage'

export default function App() {
  return (
    <BrowserRouter>
      <header className="topbar">
        <Link to="/" className="brand">
          ⛰️ nanomountains
        </Link>
        <span className="tagline">Philippine mountain guide + pre-climb planner</span>
      </header>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/mountains/:mountainId" element={<MountainPage />} />
        <Route path="/mountains/:mountainId/plans/:planId" element={<PlanPage />} />
        <Route path="*" element={<p className="page">Page not found. <Link to="/">Back to mountains</Link></p>} />
      </Routes>
    </BrowserRouter>
  )
}
