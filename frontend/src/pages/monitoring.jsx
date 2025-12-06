// src/pages/monitoring.jsx
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/homePage.css';
import '@/styles/auth.css';

import { getHomePage, getBusinessCode, authenticatedRequest } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

function groupActivities(raw = []) {
  const byShift = new Map();

  raw.forEach((act) => {
    const shiftId = act.shift_id || act._id; // fallback just in case
    if (!shiftId) return;

    let entry = byShift.get(shiftId);
    if (!entry) {
      entry = {
        shift_id: shiftId,
        employee_id: act.employee_id,
        employee_name: act.employee_name,
        shift_start: act.shift_start || null,
        shift_end: act.shift_end || null,
        clock_in_timestamp: null,
        clock_out_timestamp: null,
      };
      byShift.set(shiftId, entry);
    }

    // keep a canonical name / times
    if (!entry.shift_start && act.shift_start) entry.shift_start = act.shift_start;
    if (!entry.shift_end && act.shift_end) entry.shift_end = act.shift_end;
    if (!entry.employee_name && act.employee_name) entry.employee_name = act.employee_name;

    const ts = act.timestamp ? new Date(act.timestamp) : null;
    if (!ts) return;

    if (act.clock_in) {
      // earliest clock-in
      if (
        !entry.clock_in_timestamp ||
        ts < new Date(entry.clock_in_timestamp)
      ) {
        entry.clock_in_timestamp = act.timestamp;
      }
    } else {
      // latest clock-out
      if (
        !entry.clock_out_timestamp ||
        ts > new Date(entry.clock_out_timestamp)
      ) {
        entry.clock_out_timestamp = act.timestamp;
      }
    }
  });

  const list = Array.from(byShift.values());

  // Sort by “most recent thing that happened” (out, or in, or shift start)
  list.sort((a, b) => {
    const ta = new Date(
      a.clock_out_timestamp ||
      a.clock_in_timestamp ||
      a.shift_start ||
      0
    ).getTime();
    const tb = new Date(
      b.clock_out_timestamp ||
      b.clock_in_timestamp ||
      b.shift_start ||
      0
    ).getTime();
    return tb - ta; // newest first
  });

  return list;
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Monitoring() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('-');
  const businessCode = getBusinessCode();

  const [loading, setLoading] = useState(true);
  const [activityError, setActivityError] = useState(null);
  const [shifts, setShifts] = useState([]);

  // Fetch business name (like ManagerHome)
  useEffect(() => {
    let mounted = true;

    async function fetchHome() {
      try {
        const data = await getHomePage();
        if (!mounted) return;
        setBusinessName(data.business_name || '-');
      } catch (err) {
        console.error('Failed to fetch home page:', err);
      }
    }

    fetchHome();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch activity list
  useEffect(() => {
    let mounted = true;

    async function fetchActivity() {
      setLoading(true);
      setActivityError(null);
      try {
        const data = await authenticatedRequest('/api/manager/activity');
        const grouped = groupActivities(data.activities || []);
        if (!mounted) return;
        setShifts(grouped);
      } catch (err) {
        console.error('Failed to load manager activity:', err);
        if (mounted) setActivityError('Unable to load activity right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchActivity();
    return () => {
      mounted = false;
    };
  }, []);

  // Allow scrolling on this page (lots of cards)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = prevOverflow || '';
    };
  }, []);

  // layout constants (same feel as ManagerHome)
  const HEADER_HEIGHT = 84;
  const LEFT_NAV_WIDTH = 260;
  const HORIZONTAL_GAP = 24;
  const VERTICAL_PADDING = 32;

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
    navItem: {
      display: 'flex',
      gap: 10,
      alignItems: 'center',
      padding: '8px 6px',
      borderRadius: 8,
      cursor: 'pointer',
    },
    navIcon: { width: 36, height: 36, objectFit: 'contain' },
    mainContent: {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    },
    contentCard: {
      marginTop: 16,
      width: '100%',
      maxWidth: 1100,
      height: '100%',
      padding: 24,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.98)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    },
    contentTitle: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
    contentSubtitle: { fontSize: 14, color: '#444' },
    activityList: {
      marginTop: 8,
      overflowY: 'auto',
      paddingRight: 4,
    },
    activityCard: {
      borderRadius: 10,
      border: '1px solid #eee',
      padding: '12px 16px',
      marginBottom: 10,
      background: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    },
    activityHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 12,
    },
    employeeName: { fontSize: 16, fontWeight: 600, color: '#222' },
    shiftTime: { fontSize: 13, color: '#555' },
    metaRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 16,
      fontSize: 13,
      color: '#444',
    },
    metaItemLabel: { fontWeight: 600 },
    statusBadge: (isOpen) => ({
      padding: '2px 8px',
      borderRadius: 999,
      fontSize: 11,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      background: isOpen ? 'rgba(0, 123, 255, 0.15)' : 'rgba(40, 167, 69, 0.15)',
      color: isOpen ? '#0056b3' : '#1e7e34',
    }),
    emptyState: {
      marginTop: 16,
      fontSize: 13,
      color: '#666',
    },
  };

  return (
    <div style={styles.root} className="home-container justify-content-start">
      {/* background clocks */}
      <div className="clock clock--green" />
      <div className="clock clock--purple" />
      <div className="clock clock--orange" />
      <div className="clock clock--green"><i /></div>
      <div className="clock clock--purple"><i /></div>
      <div className="clock clock--orange"><i /></div>

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <img
            src="/img/logo.png"
            alt="Logo"
            style={{ width: 90, height: 90, objectFit: 'contain', cursor: 'pointer' }}
            onClick={() => navigate('/manager-home')}
          />
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={styles.headerTitle}>Good Work</div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.infoCard}>
            <div style={{ fontSize: 12, color: '#666' }}>Business</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>
              {businessName || '—'}
            </div>
          </div>

          <div style={styles.infoCard}>
            <div style={{ fontSize: 12, color: '#666' }}>Code</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>
              {businessCode || '—'}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={styles.mainLayout}>
        {/* Sidebar */}
        <aside style={styles.leftNav}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={styles.navItem}
              onClick={() => navigate('/schedules')}
            >
              <img
                style={styles.navIcon}
                src="/img/calenderIcon.png"
                alt="Schedules"
              />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Schedules</div>
              </div>
            </div>

            {/* Current page */}
            <div
              style={{
                ...styles.navItem,
                background: 'rgba(0,123,255,0.08)',
                fontWeight: 800,
              }}
              onClick={() => navigate('/monitoring')}
            >
              <img
                style={styles.navIcon}
                src="/img/monitorActivityIcon.png"
                alt="Monitor"
              />
              <div>
                <div style={{ fontWeight: 700, color: '#333' }}>Monitor</div>
              </div>
            </div>

            <div style={styles.navItem}>
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
              <img style={styles.navIcon} src="/img/myPayIcon.png" alt="Payroll" />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Payroll</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main monitoring content */}
        <main style={styles.mainContent}>
          <div style={styles.contentCard}>
            <div style={styles.contentTitle}>Monitoring</div>
            <div style={styles.contentSubtitle}>
              Overview of business activity, performance, and alerts.
            </div>

            <div style={{ fontSize: 13, color: '#777', marginTop: 4 }}>
              Showing most recent shifts first. Each card represents one shift with its
              clock-in and clock-out activity.
            </div>

            <div style={styles.activityList}>
              {loading && (
                <div style={styles.emptyState}>Loading activity…</div>
              )}

              {!loading && activityError && (
                <div style={styles.emptyState}>{activityError}</div>
              )}

              {!loading && !activityError && shifts.length === 0 && (
                <div style={styles.emptyState}>
                  No activity recorded yet.
                </div>
              )}

              {!loading && !activityError && shifts.map((shift) => {
                const isOpen =
                  !!shift.clock_in_timestamp && !shift.clock_out_timestamp;

                return (
                  <div key={shift.shift_id} style={styles.activityCard}>
                    <div style={styles.activityHeader}>
                      <div style={styles.employeeName}>
                        {shift.employee_name || 'Unknown employee'}
                      </div>
                      <div style={styles.shiftTime}>
                        {shift.shift_start
                          ? `${formatDateTime(shift.shift_start)}`
                          : 'Shift start unknown'}
                      </div>
                    </div>

                    {shift.shift_end && (
                      <div style={{ fontSize: 12, color: '#666' }}>
                        Scheduled end: {formatDateTime(shift.shift_end)}
                      </div>
                    )}

                    <div style={styles.metaRow}>
                      <div>
                        <span style={styles.metaItemLabel}>Clock-in:</span>{' '}
                        {formatDateTime(shift.clock_in_timestamp)}
                      </div>
                      <div>
                        <span style={styles.metaItemLabel}>Clock-out:</span>{' '}
                        {formatDateTime(shift.clock_out_timestamp)}
                      </div>
                      <div>
                        <span style={styles.metaItemLabel}>Status:</span>{' '}
                        <span style={styles.statusBadge(isOpen)}>
                          {isOpen ? 'In progress' : 'Completed'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
