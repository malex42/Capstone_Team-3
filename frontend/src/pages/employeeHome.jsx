import React, { useEffect, useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/homePage.css';
import '@/styles/auth.css';

import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import { getHomePage, getBusinessCode, getEmployeeID, authenticatedRequest, saveToken } from '@/lib/api';
    import { useNavigate } from 'react-router-dom';


const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function EmployeeHome() {
  const [businessName, setBusinessName] = useState('-');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [businessCode, setBusinessCode] = useState(getBusinessCode() || '');
  const [businessCodeInput, setBusinessCodeInput] = useState('');
  const navigate = useNavigate();

  const employeeID = getEmployeeID();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // keep calendar locked to today's month
  const today = useMemo(() => new Date(), []);

  // layout constants
  const HEADER_HEIGHT = 84; // px
  const VERTICAL_PADDING = 32; // top + bottom spacing in page container
  const LEFT_NAV_WIDTH = 260; // px
  const HORIZONTAL_GAP = 24; // gap between nav and calendar

  // wide layout: separate width/height states
  const [calendarWidth, setCalendarWidth] = useState(1000);
  const [calendarHeight, setCalendarHeight] = useState(520);

  const handleLinkBusiness = async (e) => {
    e.preventDefault();
    setError("");

    if (!businessCodeInput.trim()) {
      setError("Please enter a business code to link.");
      return;
    }

    setSubmitting(true);
    try {
        const data = await authenticatedRequest("/api/link_business", {
        method: "POST",
        body: { code: businessCodeInput.trim() },
      });
      if (data?.JWT) {
          saveToken(data.JWT)
          }
      setBusinessCode(businessCodeInput.trim());
      localStorage.setItem("businessCode", businessCode.trim());

      navigate("/manager-home");
    } catch (err) {
      setError(err?.message || "Failed to link business.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // load code fallback
    try {
      const stored = window.localStorage.getItem('businessCode');
      if (stored) setBusinessCode(stored);
    } catch (e) {}

    function computeSize() {
      if (typeof window === 'undefined') return;

      // compute a roomy width: allow calendar to take most horizontal space
      const containerHorizontalPadding = 120; // page paddings + breathing room
      const rawWidth = window.innerWidth - LEFT_NAV_WIDTH - HORIZONTAL_GAP - containerHorizontalPadding;
      // clamp to a reasonable min and max
      const cw = Math.max(700, Math.min(rawWidth, window.innerWidth - LEFT_NAV_WIDTH - HORIZONTAL_GAP - 24, 1600));

      // compute height so calendar won't be cut off; reduce a bit to ensure breathing room
      const rawHeight = window.innerHeight - HEADER_HEIGHT - VERTICAL_PADDING - 48;
      const ch = Math.max(420, Math.min(rawHeight, 1000));

      setCalendarWidth(Math.round(cw));
      setCalendarHeight(Math.round(ch));
    }

    computeSize();
    window.addEventListener('resize', computeSize);
    return () => window.removeEventListener('resize', computeSize);
  }, []);

  // lock scrolling while this view is mounted
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow || '';
    };
  }, []);


useEffect(() => {
  let mounted = true;

  async function fetchHome() {
    try {
      const data = await getHomePage();

      if (!mounted) return;

      setBusinessName(data.business_name || '');

      const mapped = (data.shifts || [])
      .filter(s => s.employee_id === employeeID) // only keep shifts for this employee
      .map((s, idx) => {
        let start = new Date(s.start)
        let end = new Date(s.end)

        let formattedStart = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        let formattedEnd = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });


        return {
          id: s._id || idx,
          title: `${String(formattedStart)} - ${String(formattedEnd)}`,
          start,
          end,
          allDay: false,
        };
      });

      setEvents(mapped);

    } catch (err) {
      console.error('Failed to fetch home page:', err);
    } finally {
      if (mounted) setLoading(false);
    }
  }

  fetchHome();
  return () => { mounted = false; };
}, []);

  const styles = {
    // Fill the full viewport and force full-width stretching
    root: {
      position: 'fixed',
      inset: 0, // top:0 right:0 bottom:0 left:0
      boxSizing: 'border-box',
      overflow: 'hidden', // prevent scrolling
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
    // Make main layout stretch horizontally
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
    calendarContainer: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    calendarCard: {
      width: calendarWidth,
      maxWidth: 'calc(100vw - 360px)', // ensure it never overflows the viewport
      height: calendarHeight,
      padding: 16,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.98)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
      zIndex: 2,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    calendarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    monthLabel: { fontSize: 18, fontWeight: 700, color: 'black' },
  };

  return (
    <div style={styles.root} className="home-container justify-content-start">
      <style>{`
        /* Scoped overrides for manager calendar weekday labels and headers */
        .manager-calendar .rbc-header {
          color: #222 !important;
          background: transparent !important;
        }
        .manager-calendar .rbc-header a {
          color: #222 !important;
        }
        .manager-calendar .rbc-month-view .rbc-row .rbc-header {
          color: #222 !important;
        }
        .manager-calendar .rbc-month-view .rbc-row .rbc-header .rbc-header-content {
          color: #222 !important;
        }
        .manager-calendar .rbc-month-view .rbc-row .rbc-day-slot {
          padding-bottom: 6px !important;
        }
        .manager-calendar .rbc-header, .manager-calendar .rbc-header .rbc-header-content {
          font-weight: 600 !important;
        }

        /* Make sure the calendar fills the card horizontally */
        .manager-calendar {
          width: 100% !important;
        }

        /* Prevent unwanted global styles from shrinking header labels */
        .manager-calendar .rbc-header a, .manager-calendar .rbc-header {
          text-decoration: none;
        }
      `}</style>

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
            <div style={{ ...styles.navItem }}>
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

<button onClick={() => navigate('/post-shift')}>
            <div style={{ ...styles.navItem }}>
              <img style={styles.navIcon} src="/img/postShitfIcon.png" alt="Post Shift" />
              <div>
                <div style={{ fontWeight: 700, color: '#666'  }}>Post Shifts</div>
              </div>
            </div>
            </button>
<button>
            <div style={{ ...styles.navItem }}>
              <img style={styles.navIcon} src="/img/takeShiftIcon.png" alt="Take Shift" />
              <div>
                <div style={{ fontWeight: 700, color: '#666'  }}>Take Shifts</div>
              </div>
            </div>
</button>

            <div style={{ ...styles.navItem }}>
              <img style={styles.navIcon} src="/img/accountIcon.png" alt="Account" />
              <div>
                <div style={{ fontWeight: 700, color: '#666'  }}>Account</div>
              </div>
            </div>

            <div style={{ ...styles.navItem }}>
              <img style={styles.navIcon} src="/img/myPayIcon.png" alt="Pay" />
              <div>
                <div style={{ fontWeight: 700, color: '#666'  }}>My pay</div>
              </div>
            </div>
          </div>

          {loading && <div style={{ marginTop: 12, color: '#666', fontSize: 13 }}>Loading shifts…</div>}
        </aside>

<main style={styles.calendarContainer}>
  <div style={styles.calendarCard}>
    {(!businessCode || businessCode === '') ? (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 40,
          gap: 16,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: '#222' }}>
          No business linked, connect with a code
        </div>

        <form onSubmit={handleLinkBusiness} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={businessCodeInput}
            onChange={(e) => setBusinessCodeInput(e.target.value)}
            placeholder="Enter business code"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #ccc',
              width: 220,
              fontSize: 14,
              backgroundColor: 'white',
              color: '#222',
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#007bff',
              color: 'white',
              fontWeight: 500,
            }}
          >
            Link
          </button>
        </form>

        {error && <div style={{ marginTop: 8, color: 'red', fontSize: 13 }}>{error}</div>}
      </div>
    ) : (
      <div style={{ flex: 1, minHeight: 0 }}>
                <style>{`
                  /* Day numbers */
                  .manager-calendar .rbc-month-view .rbc-date-cell {
                    color: #222 !important;       /* dark text for day numbers */
                  }

                  /* Weekday headers */
                  .manager-calendar .rbc-header {
                    color: #222 !important;
                    font-weight: 600;
                    background: transparent !important;
                  }

                  .manager-calendar .rbc-header a {
                    color: #222 !important;
                    text-decoration: none;
                  }

                  /* Event cards */
                  .manager-calendar .rbc-event {
                    background-color: #007bff !important;  /* blue events */
                    color: #fff !important;                /* white text */
                    border: none !important;
                    border-radius: 6px;
                    padding: 2px 4px;
                    font-size: 0.85em;
                  }

                  /* Optional: small spacing below each day */
                  .manager-calendar .rbc-month-view .rbc-row .rbc-day-slot {
                    padding-bottom: 6px !important;
                  }
                `}</style>
        <BigCalendar
          className="manager-calendar"
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          defaultView="month"
          views={['month']}
          date={today}
          toolbar={false}
          onNavigate={() => {}}
          onDrillDown={() => {}}
          style={{ width: '100%', height: '100%' }}
          popup
          selectable={false}
        />
      </div>
    )}
  </div>
</main>

      </div>
    </div>
  );
}