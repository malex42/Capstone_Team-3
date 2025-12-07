import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUser, saveToken, saveRefreshToken } from '@/lib/api'
import '@/styles/auth.css'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState('')      // must be EMPLOYEE or MANAGER
  const [code, setCode] = useState('')
  const [useCode, setUseCode] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = { firstName, lastName, username, password, role }
      if (useCode && code.trim()) body.code = code.trim()
      const res = await createUser(body)
      if (res?.JWT) saveToken(res.JWT)
      if (res?.refresh_JWT) saveRefreshToken(res.refresh_JWT)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

return (
  <div className="auth-bg d-flex min-vh-100">
    <div className="clock clock--green" />
    <div className="clock clock--purple" />
    <div className="clock clock--orange" />
    <div className="clock clock--green"><i /></div>
    <div className="clock clock--purple"><i /></div>
    <div className="clock clock--orange"><i /></div>

    <div className="container my-auto">
      <div className="row justify-content-center">
        <div className="col-12 d-flex justify-content-center">
          <div
            className="auth-card mx-auto p-4"
          >
            <h1 className="h3 fw-bold text-center mb-4">
              Create your account
            </h1>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>

              <div className="row mb-3">
                <div className="col-md-6">
                  <input
                    id="firstName"
                    type="text"
                    className="form-control"
                    placeholder="First Name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    autocomplete="firstName"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <input
                    id="lastName"
                    type="text"
                    className="form-control"
                    placeholder="Last Name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    autocomplete="lastName"
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <input
                  id="username"
                  type="text"
                  className="form-control"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="mb-3">
                <div className="input-group">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  className="form-control"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                  onClick={() => setShowPw(s => !s)}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>


              <div className="mb-3">
                <label htmlFor="role" className="form-label">Role</label>
                <select
                  id="role"
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  required
                >
                  <option value="" disabled>Select a role…</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                </select>
              </div>

              <div className="form-check mb-2">
                <input
                  id="useCode"
                  type="checkbox"
                  className="form-check-input"
                  checked={useCode}
                  onChange={e => setUseCode(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="useCode">
                  I have a code
                </label>
              </div>

              {useCode && (
                <div className="mb-3">
                  <label htmlFor="code" className="form-label">Code (optional)</label>
                  <input
                    id="code"
                    type="text"
                    className="form-control"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                  />
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 auth-cta"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Creating…
                  </>
                ) : (
                  "Create account"
                )}
              </button>

              <div className="small mt-3 text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-decoration-none">
                  Log in
                </Link>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
)
}
