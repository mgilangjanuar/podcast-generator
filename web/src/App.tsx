import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/dashboard'
import Home from './pages/home'

import './App.css'

function App() {
  return <div data-theme="dark" className="min-h-screen">
    <div className="container mx-auto py-8">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app/*" element={<Dashboard />} />
      </Routes>
    </div>
  </div>
}

export default App
