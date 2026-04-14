import React, { useContext } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { AuthProvider, AuthContext } from './AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import ProtectedRoute from './components/ProtectedRoute'

function AppShell() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  return (
    <>
      <nav className="nav">
        <div className="brand">
          TaskFlow
        </div>
        <div>
          {user ? (
            <>
              <Link to="/">Projects</Link>
              <span>{user.name || user.email}</span>
              <button type="button" className="nav-button" onClick={() => { logout(); navigate('/login') }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </nav>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}
