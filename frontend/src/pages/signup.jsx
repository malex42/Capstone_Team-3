import { useState } from 'react'
import { createUser, saveToken } from '@/lib/api'

export default function Signup() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [code, setCode] = useState('')
  const [useCode, setUseCode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    setLoading(true)
    try {
      const payload = { username, password, role }
      if (useCode && code.trim()) payload.code = code.trim()

      const res = await createUser(payload)
      if (res?.JWT) {
        saveToken(res.JWT)
      }
      setMessage(`✅ Account created for ${res.username}`)
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border shadow p-6"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        <h1 className="text-2xl font-semibold">Create Account</h1>

        {error && <div className="bg-red-50 border border-red-300 text-red-700 p-2 rounded">{error}</div>}
        {message && <div className="bg-green-50 border border-green-300 text-green-700 p-2 rounded">{message}</div>}

        <label className="block">
          <span className="text-sm">Username</span>
          <input
            type="text"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm">Password</span>
          <input
            type="password"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm">Role</span>
          <select
            className="mt-1 block w-full border rounded px-3 py-2 bg-white"
            value={role}
            onChange={e => setRole(e.target.value)}
            required
          >
            <option value="" disabled>Select a role...</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
          </select>
        </label>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useCode}
            onChange={e => setUseCode(e.target.checked)}
          />
          <span className="text-sm">I have a code</span>
        </div>

        {useCode && (
          <label className="block">
            <span className="text-sm">Code</span>
            <input
              type="text"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={code}
              onChange={e => setCode(e.target.value)}
            />
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white rounded py-2 disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Sign Up'}
        </button>
      </form>
    </div>
  )
}
