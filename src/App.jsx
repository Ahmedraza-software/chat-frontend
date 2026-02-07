import React, { useState, useEffect } from 'react'
import axios from 'axios'
import UserList from './components/UserList'
import ChatWindow from './components/ChatWindow'
import FriendRequests from './components/FriendRequests'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (currentUser) {
      fetchUsers()
    }
  }, [currentUser, refreshTrigger])

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/users`)
      const otherUsers = response.data.filter(u => u.id !== currentUser.id)
      setUsers(otherUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!username || !email || !password) {
      setError('All fields are required')
      return
    }

    try {
      const response = await axios.post(`${API_BASE}/users/register`, {
        username,
        email,
        password
      })
      setCurrentUser(response.data)
      setUsername('')
      setEmail('')
      setPassword('')
    } catch (error) {
      setError(error.response?.data?.detail || 'Registration failed')
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Username and password are required')
      return
    }

    try {
      const response = await axios.post(`${API_BASE}/users/login`, {
        username,
        password
      })
      setCurrentUser(response.data)
      setUsername('')
      setPassword('')
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed')
    }
  }

  if (!currentUser) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="title-with-dot">
            <h1>mychat</h1>
            <div className="title-dot"></div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Login</button>
              <div className="auth-toggle">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => {
                    setAuthMode('register')
                    setError('')
                  }}
                >
                  Register
                </button>
              </div>
              <div className="dummy-credentials">
                <p>Demo: testuser / testuser</p>
                <p>Demo: testuser1 / testuser1</p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Register</button>
              <div className="auth-toggle">
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="toggle-btn"
                  onClick={() => {
                    setAuthMode('login')
                    setError('')
                  }}
                >
                  Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="header">
        <div className="title-with-dot">
          <h1>mychat</h1>
          <div className="title-dot"></div>
        </div>
        <div className="header-user">
          <div className="header-avatar">{currentUser.username[0].toUpperCase()}</div>
          <span>{currentUser.username}</span>
        </div>
      </div>
      <div className="main-content">
        <div className="sidebar">
          <FriendRequests
            currentUser={currentUser}
            apiBase={API_BASE}
            onRequestHandled={() => setRefreshTrigger(refreshTrigger + 1)}
          />
          <UserList
            users={users}
            currentUser={currentUser}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            apiBase={API_BASE}
          />
          <div className="sidebar-footer">
            <div className="footer-content">
              <button 
                className="logout-btn"
                onClick={() => {
                  setCurrentUser(null)
                  setSelectedUser(null)
                  setAuthMode('login')
                }}
                title="Logout"
              >
                <span className="logout-icon">↗</span>
              </button>
            </div>
          </div>
        </div>
        {selectedUser && (
          <ChatWindow
            currentUser={currentUser}
            selectedUser={selectedUser}
            apiBase={API_BASE}
          />
        )}
      </div>
    </div>
  )
}

export default App
