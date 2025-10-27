import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUser, saveToken } from '@/lib/api'
import '@/styles/auth.css' // keeps your card/clocks styles

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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
      const body = { username, password, role }
      if (useCode && code.trim()) body.code = code.trim()
      const res = await createUser(body)                // -> /api/auth/register
      if (res?.JWT) saveToken(res.JWT)                  // backend returns { JWT: ... }
      navigate('/')                                     // go “home”; tweak if you want /create-business
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg d-flex min-vh-100">
      {/* background clocks if you kept them */}
      <div className="clock clock--green" /><div className="clock clock--purple" /><div className="clock clock--orange" />
      <div className="clock clock--green"><i/></div><div className="clock clock--purple"><i/></div><div className="clock clock--orange"><i/></div>

      <div className="container my-auto">
        <div className="row justify-content-center">
          <div className="col-12 d-flex justify-content-center">
            <div className="auth-card mx-auto">
              <h1 className="h3 fw-bold text-center mb-3">Create your account</h1>
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-floating mb-3">
                  <input id="username" type="text" className="form-control" placeholder="Username"
                         value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
                  <label htmlFor="username">Username</label>
                </div>

                <div className="mb-3">
                  <div className="input-group">
                    <div className="form-floating flex-grow-1">
                      <input id="password" type={showPw ? 'text' : 'password'} className="form-control"
                             placeholder="Password" value={password}
                             onChange={e => setPassword(e.target.value)} autoComplete="new-password" required />
                      <label htmlFor="password">Password</label>
                    </div>
                    <button type="button" className="btn btn-outline-secondary"
                            onClick={() => setShowPw(s => !s)}>
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="role" className="form-label">Role</label>
                  <select id="role" className="form-select" value={role} onChange={e => setRole(e.target.value)} required>
                    <option value="" disabled>Select a role…</option>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                  </select>
                </div>

                <div className="form-check mb-2">
                  <input id="useCode" type="checkbox" className="form-check-input"
                         checked={useCode} onChange={e => setUseCode(e.target.checked)} />
                  <label className="form-check-label" htmlFor="useCode">I have a code</label>
                </div>

                {useCode && (
                  <div className="form-floating mb-3">
                    <input id="code" type="text" className="form-control" placeholder="Invite/role code"
                           value={code} onChange={e => setCode(e.target.value)} />
                    <label htmlFor="code">Code (optional)</label>
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100 py-2 auth-cta" disabled={loading}>
                  {loading ? (<><span className="spinner-border spinner-border-sm me-2" />Creating…</>) : 'Create account'}
                </button>

                <div className="small mt-3 text-center">
                  Already have an account? <Link to="/login" className="text-decoration-none">Log in</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
