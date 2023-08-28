import { Link, Route, Routes, useLocation } from 'react-router-dom'
import App from './app'
import Settings from './settings'

export default function Dashboard() {
  const { pathname } = useLocation()

  return <div>
    <div className="tabs">
      <Link to="/app" className={`tab tab-bordered ${pathname === '/app' ? 'tab-active' : ''}`}>
        App
      </Link>
      <Link to="/app/settings" className={`tab tab-bordered ${pathname === '/app/settings' ? 'tab-active' : ''}`}>
        Settings
      </Link>
    </div>
    <div className="mt-4">
      <Routes>
        <Route index element={<App />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  </div>
}