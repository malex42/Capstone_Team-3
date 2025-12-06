// ./pages/takeShift.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import { useNavigate } from "react-router-dom";

import '@/styles/homePage.css';
import '@/styles/auth.css';

import { authenticatedRequest, getEmployeeID } from "@/lib/api";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

// --- Small card for left “Selected” list ---
function SelectedShiftCard({ shift, onRemove }) {
  const start = new Date(shift.start);
  const end = new Date(shift.end);
  const date = start.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" });
  const time = `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 10, padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr auto", gap: 8, background: "#fff" }}>
      <div>
        <div style={{ fontWeight: 700, color: "#222" }}>{date}</div>
        <div style={{ fontSize: 13, color: "#555" }}>{time}</div>
        {shift.employee_name && <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{shift.employee_name}</div>}
      </div>
      <button type="button" onClick={() => onRemove(shift.id)} style={{ border: "none", background: "transparent", color: "#c00", fontWeight: 700, cursor: "pointer" }} aria-label="Remove shift" title="Remove shift">✕</button>
    </div>
  );
}

export default function TakeShift() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);       // all events: posted + employee's own
  const [selected, setSelected] = useState([]);   // selected posted shifts
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('-');
  const [businessCode, setBusinessCode] = useState('-');

  const today = useMemo(() => new Date(), []);
  const LEFT_PANEL_WIDTH = 320;
  const HEADER_HEIGHT = 84;
  const [calendarHeight, setCalendarHeight] = useState(520);

  // --- FETCH HOMEPAGE SHIFTS + POSTED SHIFTS ---
  useEffect(() => {
    let active = true;
    async function fetchHomepage() {
      try {
        const employeeID = getEmployeeID();

        // fetch homepage shifts
        const home = await authenticatedRequest("/api/home", { method: "GET" });
        if (!active) return;

        // employee own shifts (blue, not selectable)
        const ownShifts = (home.shifts || [])
          .filter(s => s.employee_id === employeeID && !s.posted)
          .map((s, idx) => {

            const start = new Date(s.start);
            const end = new Date(s.end);

            setBusinessName(home.business_name || '');
            setBusinessCode(home.business_code || '');

            const formattedStart = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const formattedEnd   = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

            return{
                id: s._id || `own-${idx}`,
                title: `${formattedStart} - ${formattedEnd}`,
                start: new Date(s.start),
                end: new Date(s.end),
                employee_id: s.employee_id,
                employee_name: s.employee_name,
                type: 'own',
            };
          });

        setBusinessName(home.business_name || '-');
        setBusinessCode(home.business_code || '-');

        // posted shifts (green, selectable)
        const postedResp = await authenticatedRequest("/api/employee/shifts", { method: "GET" });
        const postedShifts = (postedResp.posted_shifts || [])
          .map((s, idx) => {

            const start = new Date(s.start);
            const end = new Date(s.end);

            const formattedStart = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const formattedEnd   = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

          return {
            id: s._id || `posted-${idx}`,
            title: `${formattedStart} - ${formattedEnd}`,
            start,
            end,
            employee_id: s.employee_id,
            employee_name: s.employee_name,
            type: 'posted',
          };
      });

        setEvents([...ownShifts, ...postedShifts]);
      } catch (e) {
        console.error("Failed to fetch shifts:", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchHomepage();
    return () => { active = false; };
  }, []);

  // --- RESIZE CALENDAR ---
  useEffect(() => {
    const computeHeight = () => setCalendarHeight(Math.max(480, window.innerHeight - HEADER_HEIGHT - 48));
    computeHeight();
    window.addEventListener("resize", computeHeight);
    return () => window.removeEventListener("resize", computeHeight);
  }, []);

  // --- SELECTION HANDLERS ---
  const onSelectEvent = useCallback((evt) => {
    if (evt.type !== 'posted') return; // only allow selecting posted shifts
    setSelected(prev => prev.some(p => p.id === evt.id) ? prev.filter(p => p.id !== evt.id) : [...prev, evt]);
  }, []);

  const removeSelected = useCallback((id) => setSelected(p => p.filter(s => s.id !== id)), []);
  const clearSelected = useCallback(() => setSelected([]), []);

  // --- TAKE SELECTED SHIFTS ---
  const takeSelected = useCallback(async () => {
    if (!selected.length) return;
    try {
      const results = await Promise.allSettled(selected.map(s =>
        authenticatedRequest("/api/employee/take_shift", { method: "POST", body: { shift_id: s.id } })
      ));
      const ok = results.filter(r => r.status === "fulfilled").length;
      const fail = results.length - ok;

      if (ok) {
        alert(`Took ${ok} shift${ok === 1 ? "" : "s"}${fail ? ` (${fail} failed)` : ""}.`);
        const takenIds = new Set(selected.map(s => s.id));
        setEvents(evts => evts.filter(e => !takenIds.has(e.id) || e.type === 'own'));
        setSelected([]);
      } else {
        alert("Failed to take selected shifts.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to take shifts.");
    }
  }, [selected]);

  // --- EVENT STYLING ---
  const eventPropGetter = useCallback((event) => {
    const isSelected = selected.some(s => s.id === event.id);
    const base = {
      border: 'none',
      borderRadius: 6,
      padding: '2px 4px',
      fontSize: '0.85em',
      color: '#fff',
    };
    if (event.type === 'own') return { style: { ...base, backgroundColor: '#0d6efd' } };
    if (event.type === 'posted') return { style: { ...base, backgroundColor: isSelected ? '#198754' : '#9dd9b5' } };
    return { style: base };
  }, [selected]);

  // --- STYLES ---
  const styles = {
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
    headerLeft: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' },
    headerTitle: { fontSize: 40, fontWeight: 600, margin: 0, color: 'black' },
    headerRight: { marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' },
    infoCard: { padding: '8px 12px', borderRadius: 8, background: 'rgba(250,250,250,0.95)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)' },
    leftNav: { width: 260, minWidth: 260, padding: 20, borderRadius: 10, background: 'rgba(255,255,255,0.95)', boxShadow: '0 6px 20px rgba(0,0,0,0.04)', zIndex: 3, overflow: 'auto', height: '100%' },
    navItem: { display: 'flex', gap: 10, alignItems: 'center', padding: '8px 6px', borderRadius: 8, cursor: 'pointer' },
    navIcon: { width: 36, height: 36, objectFit: 'contain' },
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', padding: 16, background: 'transparent' }}>
      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerLeft} onClick={() => navigate("/employee-home")}>
          <img src="/img/logo.png" alt="Logo" style={{ width: 90, height: 90, objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={styles.headerTitle}>Good Works</div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.infoCard}>
            <div style={{ fontSize: 12, color: '#666' }}>Business</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>{businessName}</div>
          </div>
          <div style={styles.infoCard}>
            <div style={{ fontSize: 12, color: '#666' }}>Code</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#222' }}>{businessCode}</div>
          </div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, height: `calc(100vh - ${HEADER_HEIGHT + 32}px)` }}>
        {/* LEFT NAV */}
        <aside style={styles.leftNav}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...styles.navItem, cursor: 'pointer' }} onClick={() => navigate("/log-activity")}><img style={styles.navIcon} src="/img/logActivityIcon.png" alt="Log" /><div style={{ fontWeight: 700, color: '#666' }}>Log Activity</div></div>
            <div style={styles.navItem}><img style={styles.navIcon} src="/img/calenderIcon.png" alt="My Shifts" /><div style={{ fontWeight: 700, color: '#666' }}>My Shifts</div></div>
            <div style={{ ...styles.navItem, cursor: 'pointer' }} onClick={() => navigate("/post-shift")}><img style={styles.navIcon} src="/img/arrowIcon.png" alt="Post Shift" /><div style={{ fontWeight: 700, color: '#666' }}>Post Shifts</div></div>
            <div style={{ ...styles.navItem, cursor: 'pointer' }} onClick={() => navigate("/take-shift")}><img style={styles.navIcon} src="/img/takeShiftIcon.png" alt="Take Shift" /><div style={{ fontWeight: 700, color: '#666' }}>Take Shifts</div></div>
            <div style={styles.navItem}><img style={styles.navIcon} src="/img/accountIcon.png" alt="Account" /><div style={{ fontWeight: 700, color: '#666' }}>Account</div></div>
            <div style={styles.navItem}><img style={styles.navIcon} src="/img/myPayIcon.png" alt="Pay" /><div style={{ fontWeight: 700, color: '#666' }}>My Pay</div></div>
          </div>
          {loading && <div style={{ marginTop: 12, color: '#666', fontSize: 13 }}>Loading shifts…</div>}
        </aside>

        {/* RIGHT: Selected + Calendar */}
        <div style={{ display: 'grid', gridTemplateColumns: `${LEFT_PANEL_WIDTH}px 1fr`, gap: 16, height: '100%' }}>
          {/* Selected */}
          <aside style={{ background: "rgba(255,255,255,0.98)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.06)", padding: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><div style={{ fontWeight: 800, color: "#222" }}>Selected Shifts</div><div style={{ fontSize: 13, color: "#666" }}>{selected.length}</div></div>
            <div style={{ margin: "10px 0", height: 1, background: "#eee" }} />
            <div style={{ overflow: "auto", display: "grid", gap: 10 }}>
              {selected.length === 0 && <div style={{ color: "#777", fontSize: 14 }}>Click posted shifts to add here.</div>}
              {selected.map(s => <SelectedShiftCard key={s.id} shift={s} onRemove={removeSelected} />)}
            </div>
            <div style={{ marginTop: "auto", display: "grid", gap: 8 }}>
              <button type="button" onClick={takeSelected} disabled={!selected.length} style={{ padding: "10px 12px", borderRadius: 10, border: "none", background: selected.length ? "#198754" : "#b7dfc8", color: "#fff", fontWeight: 700, cursor: selected.length ? "pointer" : "not-allowed" }}>Take {selected.length || ""} Shift{selected.length === 1 ? "" : "s"}</button>
              <button type="button" onClick={clearSelected} disabled={!selected.length} style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#333", fontWeight: 600, cursor: selected.length ? "pointer" : "not-allowed" }}>Clear</button>
            </div>
          </aside>

          {/* Calendar */}
          <section style={{ background: "rgba(255,255,255,0.98)", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.06)", padding: 12, overflow: "hidden" }}>
            <BigCalendar className="take-calendar" localizer={localizer} events={events} startAccessor="start" endAccessor="end" defaultView="month" views={["month"]} date={today} toolbar style={{ height: calendarHeight, width: "100%" }} popup selectable={false} onSelectEvent={onSelectEvent} eventPropGetter={eventPropGetter} />
          </section>
        </div>
      </div>
    </div>
  );
}
