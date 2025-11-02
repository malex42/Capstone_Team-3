import React, { useEffect, useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/homePage.css';
import '@/styles/auth.css';

import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import { getHomePage, getBusinessCode } from '@/lib/api';
import { useNavigate } from "react-router-dom";

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function ManagerScheduleEditor() {

  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('-');
  const businessCode = getBusinessCode();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = useMemo(() => new Date(), []);

  const HEADER_HEIGHT = 84;
  const LEFT_NAV_WIDTH = 260;
  const HORIZONTAL_GAP = 24;
  const VERTICAL_PADDING = 32;
  const PANEL_WIDTH = 400;

  const [calendarWidth, setCalendarWidth] = useState(600);
  const [calendarHeight, setCalendarHeight] = useState(520);

  const clocks = [
    { color: "green", top: 20, left: 50 },
    { color: "purple", top: 150, left: 500 },
    { color: "orange", top: 500, left: 100 },
  ];

  function ClockBackground() {
    return (
      <>
        {clocks.map(({ color, top, left }) => (
          <div
            key={color}
            className={`clock clock--${color}`}
            style={{
              position: "fixed",
              top: top,
              left: left,
              zIndex: -9999,
              pointerEvents: "none",
            }}
          >
            <i />
          </div>
        ))}
      </>
    );
  }

  useEffect(() => {
    function computeSize() {
      if (typeof window === 'undefined') return;
      const rawWidth = window.innerWidth - LEFT_NAV_WIDTH - PANEL_WIDTH - HORIZONTAL_GAP - 40;
      const cw = Math.max(500, Math.min(rawWidth, 1000));
      const rawHeight = window.innerHeight - HEADER_HEIGHT - VERTICAL_PADDING;
      const ch = Math.max(420, Math.min(rawHeight, 900));
      setCalendarWidth(Math.round(cw));
      setCalendarHeight(Math.round(ch));
    }
    computeSize();
    window.addEventListener('resize', computeSize);
    return () => window.removeEventListener('resize', computeSize);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function fetchHome() {
      try {
        const data = await getHomePage();
        if (!mounted) return;
        setBusinessName(data.business_name || '');
        const mapped = (data.shifts || []).map((s, idx) => {
          let start = s.start ? new Date(s.start) : new Date();
          let end = s.end ? new Date(s.end) : new Date(start.getTime() + 60*60*1000);
          if (isNaN(start)) start = new Date();
          if (isNaN(end)) end = new Date(start.getTime() + 60*60*1000);
          const formattedStart = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          const formattedEnd = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          return {
            id: s._id || idx,
            title: `${String(s.employee_name ?? '').slice(0,10).toUpperCase()}: ${formattedStart} - ${formattedEnd}`,
            start,
            end,
            allDay: false,
          };
        });
        setEvents(mapped);
      } catch (err) {
        console.error('Failed to fetch shifts:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchHome();
    return () => { mounted = false; };
  }, []);

  const eventsForSelectedDate = events.filter(e => {
    const eDate = new Date(e.start);
    return eDate.toDateString() === selectedDate.toDateString();
  });

  const styles = {
    root: { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', padding: 18, background: 'transparent', overflow: 'hidden' },
    header: { height: HEADER_HEIGHT - 16, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.97)', boxShadow: '0 6px 20px rgba(0,0,0,0.06)', width: '100%' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    headerTitle: { fontSize: 40, fontWeight: 600, margin: 0, color: 'black' },
    headerRight: { marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' },
    mainLayout: { display: 'flex', gap: HORIZONTAL_GAP, marginTop: 12, flex: 1 },
    leftNav: { width: LEFT_NAV_WIDTH, minWidth: LEFT_NAV_WIDTH, padding: 20, borderRadius: 10, background: 'rgba(255,255,255,0.95)', boxShadow: '0 6px 20px rgba(0,0,0,0.04)', overflow: 'auto' },
    detailsPanel: { width: PANEL_WIDTH, display: 'flex', flexDirection: 'column', gap: 16 },
    panelCard: { padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.95)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', flex: 1, overflowY: 'auto' },
    buttonContainer: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
    calendarContainer: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' },
    calendarCard: { width: calendarWidth, height: calendarHeight, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.98)', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
  };

  return (
    <div style={styles.root}>
      <ClockBackground />

      <header style={styles.header}>
        <div style={{ ...styles.headerLeft, cursor: "pointer" }}
             onClick={() => navigate("/manager-home")}
        >
          <img
            src="/img/logo.png"
            alt="Logo"
            style={{ width: 90, height: 90, objectFit: "contain" }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={styles.headerTitle}>Good Work</div>
        </div>
        <div style={styles.headerRight}>
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(250,250,250,0.95)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Business</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>{businessName || '—'}</div>
          </div>
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(250,250,250,0.95)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' }}>
            <div style={{ fontSize: 12, color: '#666' }}>Code</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>{businessCode || '—'}</div>
          </div>
        </div>
      </header>

      <div style={styles.mainLayout}>
        {/* Left Sidebar */}
        <aside style={styles.leftNav}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: "logActivityIcon.png", label: "Log Activity" },
              { icon: "calenderIcon.png", label: "Schedules" },
              { icon: "monitorActivityIcon.png", label: "Monitor" },
              { icon: "alertIcon.png", label: "Alerts" },
              { icon: "accountIcon.png", label: "Account" },
              { icon: "myPayIcon.png", label: "Payroll" },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 6px', borderRadius: 8, cursor: 'pointer' }}>
                <img style={{ width: 36, height: 36, objectFit: 'contain' }} src={`/img/${item.icon}`} alt={item.label} />
                <div><div style={{ fontWeight: 700, color: '#666' }}>{item.label}</div></div>
              </div>
            ))}
            {loading && <div style={{ marginTop: 12, color: '#666', fontSize: 13 }}>Loading shifts…</div>}
          </div>
        </aside>

        {/* Panel for date + shifts */}
        <div style={styles.detailsPanel}>
          <div style={styles.panelCard}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{format(selectedDate, 'eeee, LLLL d, yyyy')}</div>

            {eventsForSelectedDate.length === 0 ? (
              <div style={{ color: '#666' }}>No shifts for this date.</div>
            ) : (
              eventsForSelectedDate.map(e => (
                <div key={e.id} style={{ padding: '6px 8px', borderRadius: 6, background: '#007bff', color: '#fff', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{e.title}</span>
                  <button style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 4, padding: '2px 6px', color: '#fff', cursor: 'pointer' }}>Edit</button>
                </div>
              ))
            )}
          </div>

          {/* Buttons below the panel */}
          <div style={styles.buttonContainer}>
            <button style={{ padding: '10px 12px', borderRadius: 8, background: '#28a745', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Add Shift</button>
            <button style={{ padding: '10px 12px', borderRadius: 8, background: '#17a2b8', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}>New Schedule</button>
          </div>
        </div>

        {/* Calendar */}
        <main style={styles.calendarContainer}>
          <div style={styles.calendarCard}>
            <style>{`
              .manager-calendar .rbc-month-view .rbc-date-cell { color: #222 !important; }
              .manager-calendar .rbc-header { color: #222 !important; font-weight: 600; background: transparent !important; }
              .manager-calendar .rbc-header a { color: #222 !important; text-decoration: none; }
              .manager-calendar .rbc-event { background-color: #007bff !important; color: #fff !important; border: none !important; border-radius: 6px; padding: 2px 4px; font-size: 0.85em; }
              .manager-calendar .rbc-month-view .rbc-row .rbc-day-slot { padding-bottom: 6px !important; }
            `}</style>

            <div style={{ fontSize: 18, fontWeight: 700, color: 'black', marginBottom: 8 }}>
              {format(selectedDate, 'LLLL yyyy')}
            </div>

            <BigCalendar
              className="manager-calendar"
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              views={['month']}
              date={selectedDate}
              selectable
              onSelectSlot={(slotInfo) => setSelectedDate(slotInfo.start)}
              onSelectEvent={(event) => setSelectedDate(new Date(event.start))}
              toolbar={false}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
