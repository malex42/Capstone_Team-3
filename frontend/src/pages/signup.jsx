import { useState } from 'react'
import { createUser, saveToken } from '@/lib/api'
import '@/styles/auth.css'              // <-- add this line

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [code, setCode] = useState('')
  const [useCode, setUseCode] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(''); setError(''); setLoading(true)
    try {
      const payload = { username, password, role }
      if (useCode && code.trim()) payload.code = code.trim()
      const res = await createUser(payload)
      if (res?.JWT) saveToken(res.JWT)
      setMessage(`Account created for ${res.username}`)
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg d-flex min-vh-100">
      {/* Background clocks */}
      <div className="clock clock--green" />
      <div className="clock clock--purple" />
      <div className="clock clock--orange" />
      <div className="clock clock--green"><i /></div>
      <div className="clock clock--purple"><i /></div>
      <div className="clock clock--orange"><i /></div>

      <div className="container my-auto">
        <div className="row justify-content-center">
          <div className="col-12 d-flex justify-content-center">
            {/* optional: your logo/top-left if you have one */}
            {/* <img src="/logo.svg" alt="App" className="mb-3 ms-2 small-logo d-none d-md-block" /> */}

            <div className="auth-card mx-auto">
              <h1 className="h3 fw-bold text-center mb-3">Create your account</h1>

              {error && <div className="alert alert-danger py-2">{error}</div>}
              {message && <div className="alert alert-success py-2">{message}</div>}

              {/* Google button (placeholder – wire up later if you add OAuth)
              <button type="button" className="btn btn-google w-100 mb-3" disabled>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                     alt="" width="18" height="18" className="me-2" />
                Continue with Google
              </button> */}
              {/* 
              <div className="auth-divider my-3">
                <span>or</span>
              </div> */}

              <form onSubmit={handleSubmit} noValidate>
                {/* Username (your backend expects "username") */}
                <div className="form-floating mb-3">
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
                  <label htmlFor="username">Username</label>
                </div>

                {/* Password with show/hide */}
                <div className="mb-3">
                  <div className="input-group">
                    <div className="form-floating flex-grow-1">
                      <input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <label htmlFor="password">Password</label>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPw(s => !s)}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Role select to match your enum */}
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
                    {/* add more if your Role enum has them */}
                  </select>
                </div>

                {/* Optional code */}
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
                  <div className="form-floating mb-3">
                    <input
                      id="code"
                      type="text"
                      className="form-control"
                      placeholder="Invite/role code"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                    />
                    <label htmlFor="code">Code (optional)</label>
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100 py-2 auth-cta" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      Creating…
                    </>
                  ) : 'Create account'}
                </button>

                <p className="text-muted small mt-3 mb-2">
                  By creating your account, you agree to the <a href="#" className="text-decoration-none">Terms of Service</a> and{' '}
                  <a href="#" className="text-decoration-none">Privacy Policy</a>.
                </p>

                <div className="small">
                  Already have an account? <a href="/login" className="text-decoration-none">Log in</a>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
