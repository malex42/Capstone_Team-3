import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import '/css/style.css'
import { postJSON } from './lib/api'

export default function Login() {
  const [role, setRole] = useState('manager')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { ok, data } = await postJSON('/api/login', { role, username, password })
      if (!ok) throw new Error((data && data.message) || 'Login failed')
      const token = data.access_token || data.token
      if (token) localStorage.setItem('token', token)

      window.location.href = '/'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container text-center">
      <div className="row justify-content-center">
        <header className="col-9 text-center">
          <img src="/img/logo.png" alt="Logo" className="img-fluid mx-auto d-block" />
        </header>
      </div>

      <form className="mt-4" onSubmit={handleSubmit}>
        <div className="row mb-3 align-items-center">
          <label htmlFor="role" className="col-sm-3 col-form-label text-sm-end">Role:</label>
          <div className="col-sm-9">
            <select
              id="role"
              name="role"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
            </select>
          </div>
        </div>

        <div className="row mb-3 align-items-center">
          <label htmlFor="username" className="col-sm-3 col-form-label text-sm-end">Username:</label>
          <div className="col-sm-9">
            <input
              type="text"
              id="username"
              className="form-control"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        <div className="row mb-3 align-items-center">
          <label htmlFor="pwd" className="col-sm-3 col-form-label text-sm-end">Password:</label>
          <div className="col-sm-9">
            <input
              type="password"
              id="pwd"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="text-danger mb-3">{error}</div>}

        <div className="row">
          <div className="col-sm-9 offset-sm-3 d-flex">
            <button type="submit" className="btn btn-primary px-4 py-2" disabled={loading}>
              {loading ? 'Logging in...' : 'Log in'}
            </button>
            <a href="#" className="ms-3 align-self-center">First time user</a>
          </div>
        </div>
      </form>
    </div>
  )
}