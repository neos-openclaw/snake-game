import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Game from './pages/Game'
import Leaderboard from './pages/Leaderboard'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ id: string; username: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogin = (token: string, userData: { id: string; username: string }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setIsAuthenticated(true)
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUser(null)
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated
                ? <Navigate to="/game" />
                : <Login onLogin={handleLogin} />
            }
          />
          <Route
            path="/game"
            element={
              isAuthenticated && user
                ? <Game user={user} onLogout={handleLogout} />
                : <Navigate to="/login" />
            }
          />
          <Route
            path="/leaderboard"
            element={
              isAuthenticated && user
                ? <Leaderboard user={user} onLogout={handleLogout} />
                : <Navigate to="/login" />
            }
          />
          <Route
            path="/"
            element={<Navigate to={isAuthenticated ? "/game" : "/login"} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
