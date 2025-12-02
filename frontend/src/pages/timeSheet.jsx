import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import '@/styles/homePage.css'
import '@/styles/auth.css'
import { getHomePage, getBusinessCode } from '@/lib/api'

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
    return () => {
      mounted = false
    }
  }, [])

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
        <div style={styles.headerLeft}>
          <img src="/img/logo.png" alt="Logo" style={{ width: 90, height: 90, objectFit: 'contain' }} />
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
            <div style={styles.navItem}>
              <img style={styles.navIcon} src="/img/logActivityIcon.png" alt="Log" />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Log Activity</div>
              </div>
            </div>

            <div style={styles.navItem} onClick={() => navigate('/schedules')}>
              <img style={styles.navIcon} src="/img/calenderIcon.png" alt="Schedules" />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Schedules</div>
              </div>
            </div>

            <div style={styles.navItem}>
              <img style={styles.navIcon} src="/img/monitorActivityIcon.png" alt="Monitor" />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Monitor</div>
              </div>
            </div>

            <div style={styles.navItem} onClick={() => navigate('/alert')}>
              <img style={styles.navIcon} src="/img/alertIcon.png" alt="Alerts" />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Alerts</div>
              </div>
            </div>

            <div style={styles.navItem}>
              <img style={styles.navIcon} src="/img/accountIcon.png" alt="Account" />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Account</div>
              </div>
            </div>

            <div style={styles.navItem}>
              <img style={styles.navIcon} src="/img/myPayIcon.png" alt="Pay" />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Payroll</div>
              </div>
            </div>
          </div>

          {loading && <div style={{ marginTop: 12, color: '#666', fontSize: 13 }}>Loading shifts…</div>}
        </aside>

        <main style={{ flex: 1, minWidth: 0 }}>
          {/* blank workspace */}
        </main>
      </div>
    </div>
  )
}