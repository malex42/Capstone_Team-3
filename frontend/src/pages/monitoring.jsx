// src/pages/monitoring.jsx
import React, { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/homePage.css';
import '@/styles/auth.css';

import { getHomePage, getBusinessCode } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

export default function Monitoring() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('-');
  const businessCode = getBusinessCode();

  // fetch business name like ManagerHome
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

  // lock scrolling like ManagerHome
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
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
      minHeight: '70%',
      padding: 24,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.98)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
    },
    contentTitle: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
    contentSubtitle: { fontSize: 14, color: '#666' },
    sectionHeader: { fontSize: 16, fontWeight: 600, marginTop: 16, marginBottom: 8 },
    placeholderBox: {
      borderRadius: 8,
      border: '1px dashed #ddd',
      padding: 12,
      fontSize: 13,
      color: '#777',
    },
  };

  return (
    <div style={styles.root} className="home-container justify-content-start">
      {/* same background clocks as other pages */}
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
              onClick={() => navigate('/manager-home')}
            >
              <img
                style={styles.navIcon}
                src="/img/logActivityIcon.png"
                alt="Log Activity"
              />
              <div>
                <div style={{ fontWeight: 700, color: '#666' }}>Log Activity</div>
              </div>
            </div>

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

            <div style={styles.sectionHeader}>Status Summary</div>
            <div style={styles.placeholderBox}>
              {/* Placeholder content – you can replace with real metrics later */}
              <p style={{ marginBottom: 4 }}>
                • Total employees on shift: <strong>0</strong>
              </p>
              <p style={{ marginBottom: 4 }}>
                • Open shift alerts: <strong>0</strong>
              </p>
              <p style={{ marginBottom: 0 }}>
                • Pending shift exchanges: <strong>0</strong>
              </p>
            </div>

            <div style={styles.sectionHeader}>Recent Activity</div>
            <div style={styles.placeholderBox}>
              <p style={{ margin: 0 }}>
                This section will show a feed of recent schedule changes,
                shift pickups, and other manager-relevant events.
              </p>
            </div>

            <div style={styles.sectionHeader}>Future Ideas</div>
            <div style={styles.placeholderBox}>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Graphs for daily / weekly hours per employee</li>
                <li>Alerts for understaffed time slots</li>
                <li>Overtime / hour cap warnings</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
