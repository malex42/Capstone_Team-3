import React, { useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import '/css/style.css'
import { Link } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { loginUser, saveToken } from '@/lib/api'



//import { postJSON } from './lib/api'



export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // new state + handler for showing password
  const [showPassword, setShowPassword] = useState(false)
  const toggleShowPassword = () => setShowPassword(s => !s)

  const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')
  setLoading(true)

  try {
    const payload = { username, password }
    const res = await loginUser(payload)

    if (res?.JWT) {
      saveToken(res.JWT)

      // decode token for role-based routing
      const decoded = jwtDecode(res.JWT)
      const userRole = decoded.role
      const businessCode = decoded.code

      // redirect based on role
      if (userRole === 'MANAGER' || userRole == 'manager'){
          if (businessCode != null && businessCode != ''){
              window.location.href = '/manager-home'

              }
          else {
              window.location.href = '/create-business'
              }
      } else if (userRole === 'EMPLOYEE' || userRole == 'employee') {
        window.location.href = '/employee-home'
      } else {
          throw new Error('Login Failed')
    }

    } else {
      throw new Error('Invalid response from server')
    }
  } catch (err) {
    setError(err.message || 'Login failed')
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
      
      <div className="container text-center">
        <div className="row justify-content-center">
          <header className="col-9 text-center">
            <img src="/img/logo.png" alt="Logo" className="img-fluid mx-auto d-block"/>
          </header>
        </div>


        
        
         <form className="mt-4" onSubmit={handleSubmit}>
{/*           <div className="row mb-3 align-items-center"> */}
{/*             <label htmlFor="role" className="col-sm-3 col-form-label text-sm-end">Role:</label> */}
{/*             <div className="col-sm-9"> */}
{/*               <select */}
{/*                 id="role" */}
{/*                 name="role" */}
{/*                 className="form-select" */}
{/*                 value={role} */}
{/*                 onChange={(e) => setRole(e.target.value)} */}
{/*               > */}
{/*                 <option value="manager">Manager</option> */}
{/*                 <option value="employee">Employee</option> */}
{/*               </select> */}
{/*             </div> */}
{/*           </div> */}

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
              <div className="input-group w-100">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="pwd"
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={toggleShowPassword}
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="text-danger mb-3">{error}</div>}

          <div className="row">
            <div className="col-sm-9 offset-sm-3 d-flex">
              <button type="submit" className="btn btn-primary px-4 py-2" disabled={loading}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
{/*               <a href="#" className="ms-3 align-self-center">First time user</a> */}
                    <Link to="/signup" className="ms-3 align-self-center">
                      First time user
                    </Link>

            </div>
          </div>
        </form>
      </div>
    </div>
  )
}