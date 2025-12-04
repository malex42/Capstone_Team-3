import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/styles/homePage.css'
import '@/styles/auth.css'
import { getHomePage, getBusinessCode } from '@/lib/api'

const API_BASE = import.meta.env.VITE_API_URL || ''  // e.g. 'http://localhost:3333'
const HEADER_HEIGHT = 84
const VERTICAL_PADDING = 32
const LEFT_NAV_WIDTH = 260
const HORIZONTAL_GAP = 24

export default function ManagerHome() {
  const navigate = useNavigate()
  const [businessName, setBusinessName] = useState('-')
  const businessCode = getBusinessCode()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // new state for activity endpoint
  const [upcomingShift, setUpcomingShift] = useState(null)
  const [clockedIn, setClockedIn] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState('')

  // utility to get token - adjust key if your app stores token under a different name
  const getAuthToken = () => window.localStorage.getItem('token') || window.localStorage.getItem('authToken') || ''

  const fetchActivity = useCallback(async () => {
    setActionMessage('')
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/activity`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setUpcomingShift(data.upcoming_shift ?? null)
      setClockedIn(Boolean(data.clocked_in))
    } catch (err) {
      console.error('Failed to load activity:', err)
      setActionMessage('Could not load activity.')
    }
  }, [])

  const handleLogActivity = useCallback(async (clockIn) => {
    if (!upcomingShift?._id) {
      setActionMessage('No shift selected to log.')
      return
    }
    setActionLoading(true)
    setActionMessage('')
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE}/api/log_activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ shift_id: upcomingShift._id, clock_in: clockIn }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`)
      setClockedIn(clockIn)
      setActionMessage(json.message || (clockIn ? 'Clocked in' : 'Clocked out'))
    } catch (err) {
      console.error('Log activity failed:', err)
      setActionMessage(err.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }, [upcomingShift])

  // lock scrolling while this view is mounted
  useEffect(() => {
    if (typeof document === 'undefined') return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow || ''
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function fetchHome() {
      try {
        const data = await getHomePage()
        if (!mounted) return
        setBusinessName(data.business_name || '')

        const mapped = (data.shifts || []).map((s, idx) => {
          let start = s.start ? new Date(s.start) : new Date()
          let end = s.end ? new Date(s.end) : new Date(start.getTime() + 60 * 60 * 1000)
          if (isNaN(start)) start = new Date()
          if (isNaN(end)) end = new Date(start.getTime() + 60 * 60 * 1000)

          const formattedStart = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          const formattedEnd = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

          return {
            id: s._id || idx,
            title: `${String(s.employee_name ?? '').slice(0, 10).toUpperCase()}: ${formattedStart} - ${formattedEnd}`,
            start,
            end,
            allDay: false,
          }
        })

        setEvents(mapped)
      } catch (err) {
        console.error('Failed to fetch home page:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchHome()
    fetchActivity() // load activity endpoint as well
    return () => {
      mounted = false
    }
  }, [fetchActivity])

  const styles = {
    root: {
      position: 'fixed',
      inset: 0,
      boxSizing: 'border-box',
      overflow: 'hidden',
      padding: '18px 28px',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
    },
    header: {
      height: HEADER_HEIGHT - 16,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '12px 18px',
      borderRadius: 10,
      background: 'rgba(255,255,255,0.97)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
      zIndex: 5,
      position: 'relative',
      width: '100%',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    headerTitle: { fontSize: 40, fontWeight: 600, margin: 0, color: 'black' },
    headerRight: { marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' },
    infoCard: {
      padding: '8px 12px',
      borderRadius: 8,
      background: 'rgba(250,250,250,0.95)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
    },
    mainLayout: {
      display: 'flex',
      gap: HORIZONTAL_GAP,
      marginTop: 12,
      height: `calc(100vh - ${HEADER_HEIGHT}px - ${VERTICAL_PADDING / 2}px)`,
      width: '100%',
      alignItems: 'stretch',
    },
    leftNav: {
      width: LEFT_NAV_WIDTH,
      minWidth: LEFT_NAV_WIDTH,
      padding: 20,
      borderRadius: 10,
      background: 'rgba(255,255,255,0.95)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.04)',
      zIndex: 3,
      overflow: 'auto',
      height: '100%',
    },
    navItem: { display: 'flex', gap: 10, alignItems: 'center', padding: '8px 6px', borderRadius: 8, cursor: 'pointer' },
    navIcon: { width: 36, height: 36, objectFit: 'contain' },
  }

  return (
    <div style={styles.root} className="home-container justify-content-start">
      <div className="clock clock--green" />
      <div className="clock clock--purple" />
      <div className="clock clock--orange" />
      <div className="clock clock--green"><i /></div>
      <div className="clock clock--purple"><i /></div>
      <div className="clock clock--orange"><i /></div>

      <header style={styles.header}>

        <div style={{ ...styles.headerLeft, cursor: "pointer" }} onClick={() => navigate("/employee-home")}>
          <img src="/img/logo.png" alt="Logo" style={{ width: 90, height: 90, objectFit: "contain" }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={styles.headerTitle}>Good Work</div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.infoCard}>
            <div style={{ fontSize: 12, color: '#666' }}>Business</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>{businessName || '—'}</div>
          </div>

          <div style={styles.infoCard}>
            <div style={{ fontSize: 12, color: '#666' }}>Code</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>{businessCode || '—'}</div>
          </div>
        </div>
      </header>

      <div style={styles.mainLayout}>
        <aside style={styles.leftNav}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>


            <div
            style={{ ...styles.navItem, cursor: "pointer" }}
              onClick={() => navigate("/log-activity")}
            >
              <img style={styles.navIcon} src="/img/logActivityIcon.png" alt="Log" />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Log Activity</div>
              </div>
            </div>

            <div style={{ ...styles.navItem }}>
              <img style={styles.navIcon} src="/img/calenderIcon.png" alt="My Shifts" />
              <div>
                <div style={{ fontWeight: 700, color: '#666'  }}>My Shifts</div>
              </div>
            </div>

            <div
              style={{ ...styles.navItem, cursor: "pointer" }}
              onClick={() => navigate("/post-shift")}
            >
              <img style={styles.navIcon} src="/img/arrowIcon.png" alt="Post Shift" />
              <div>
                <div style={{ fontWeight: 700, color: "#666" }}>Post Shifts</div>
              </div>
            </div>

            <div
              style={{ ...styles.navItem, cursor: "pointer" }}
              onClick={() => navigate("/take-shift")}
            >
              <img style={styles.navIcon} src="/img/takeShiftIcon.png" alt="Take Shift" />
              <div>
                <div style={{ fontWeight: 700, color: "#666" }}>Take Shifts</div>
              </div>
            </div>

            <div style={{ ...styles.navItem }}>
              <img style={styles.navIcon} src="/img/accountIcon.png" alt="Account" />
              <div>
                <div style={{ fontWeight: 700, color: '#666'  }}>Account</div>
              </div>
            </div>

            <div style={{ ...styles.navItem }}>
              <img style={styles.navIcon} src="/img/myPayIcon.png" alt="Pay" />
              <div>
                <div style={{ fontWeight: 700, color: '#666'  }}
                     onClick={() => navigate("/timeSheet")}>My pay</div>

              </div>
            </div>
          </div>

          {loading && <div style={{ marginTop: 12, color: '#666', fontSize: 13 }}>Loading shifts…</div>}
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={{ padding: 20, borderRadius: 10, background: 'rgba(255,255,255,0.95)', boxShadow: '0 6px 20px rgba(0,0,0,0.04)', height: '100%' }}>
            <header style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#222' }}>Log Activity</div>
            </header>

            {/* Activity section using the API */}
            <section style={{ padding: 12, color: 'black' }}>
              <h5>Upcoming shift</h5>

              {!upcomingShift ? (
                <div>No upcoming shift</div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <div><strong>{upcomingShift.employee_name}</strong></div>
                  <div>
                    {new Date(upcomingShift.start).toLocaleString()} — {new Date(upcomingShift.end).toLocaleString()}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 8 }}>
                <button
                  className="btn btn-primary me-2"
                  disabled={actionLoading || !upcomingShift}
                  onClick={() => handleLogActivity(true)}
                >
                  {actionLoading && !clockedIn ? 'Processing...' : 'Clock In'}
                </button>

                <button
                  className="btn btn-outline-secondary"
                  disabled={actionLoading || !upcomingShift}
                  onClick={() => handleLogActivity(false)}
                >
                  {actionLoading && clockedIn ? 'Processing...' : 'Clock Out'}
                </button>
              </div>

              {typeof actionMessage === 'string' && actionMessage && (
                <div style={{ marginTop: 12, color: '#333' }}>{actionMessage}</div>
              )}
            </section>

            <div className="container" style={{ color: 'black' }}>
              <header>No alerts</header>
              
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}