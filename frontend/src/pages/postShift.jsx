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

// ---- Calendar localizer ----
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });


// Small card shown in the left “Selected” list
function SelectedShiftCard({ shift, onRemove }) {
  const start = new Date(shift.start);
  const end = new Date(shift.end);
  const date = start.toLocaleDateString(undefined, { month: "short", day: "numeric", weekday: "short" });
  const time = `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 10,
        padding: "10px 12px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 8,
        background: "#fff",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, color: "#222" }}>{date}</div>
        <div style={{ fontSize: 13, color: "#555" }}>{time}</div>
        {shift.employee_name && (
          <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>{shift.employee_name}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onRemove(shift.id)}
        style={{
          border: "none",
          background: "transparent",
          color: "#c00",
          fontWeight: 700,
          cursor: "pointer",
        }}
        aria-label="Remove shift"
        title="Remove shift"
      >
        ✕
      </button>
    </div>
  );
}

export default function PostShift() {
  const navigate = useNavigate();

  // Right calendar data (this employee’s shifts)
  const [events, setEvents] = useState([]);     // { id, title, start, end, employee_id, employee_name }
  const [loading, setLoading] = useState(true);

  // Left panel (selected by the user)
  const [selected, setSelected] = useState([]);
  const [businessName, setBusinessName] = useState('-');
  const [businessCode, setBusinessCode] = useState('-');


  // Month lock
  const today = useMemo(() => new Date(), []);

  // Layout sizing
  const LEFT_PANEL_WIDTH = 320;
  const [calendarWidth, setCalendarWidth] = useState(1000);
  const [calendarHeight, setCalendarHeight] = useState(520);
  const HEADER_HEIGHT = 84; // px
  const VERTICAL_PADDING = 32; // top + bottom spacing in page container
  const LEFT_NAV_WIDTH = 260; // px
  const HORIZONTAL_GAP = 24; // gap between nav and calendar

  // --- LOAD SHIFTS THE SAME WAY AS HOME SCREEN ---
  useEffect(() => {
    let active = true;

    async function loadShifts() {
      try {
        const employeeID = getEmployeeID();
        const home = await authenticatedRequest("/api/home", { method: "GET" });
        if (!active) return;

        const mapped = (home.shifts || [])
          .filter(s => s.employee_id === employeeID && !s.posted)
          .map((s, idx) => {
            const start = new Date(s.start);
            const end = new Date(s.end);

            setBusinessName(home.business_name || '');
            setBusinessCode(home.business_code || '');

            const formattedStart = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const formattedEnd   = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

            return {
              id: s._id || idx,
              title: `${formattedStart} - ${formattedEnd}`,
              start,
              end,
              allDay: false,
              employee_id: s.employee_id,
              employee_name: s.employee_name,
            };
          });

        setEvents(mapped);

      } catch (err) {
        console.error("Failed to load employee shifts:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadShifts();
    return () => { active = false };
  }, []);

  // Resize calendar with viewport
  useEffect(() => {
    function computeHeight() {
      const h = Math.max(480, window.innerHeight - HEADER_HEIGHT - 48);
      setCalendarHeight(h);
    }
    computeHeight();
    window.addEventListener("resize", computeHeight);
    return () => window.removeEventListener("resize", computeHeight);
  }, []);

  // Toggle event selection by clicking on an event
  const onSelectEvent = useCallback((evt) => {
    setSelected((prev) => {
      const exists = prev.some((p) => p.id === evt.id);
      return exists ? prev.filter((p) => p.id !== evt.id) : [...prev, evt];
    });
  }, []);

  const removeSelected = useCallback((id) => {
    setSelected((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearSelected = useCallback(() => setSelected([]), []);

  // --- POST EACH SELECTED SHIFT TO /api/employee/post_shift ---
  const postSelected = useCallback(async () => {
    if (selected.length === 0) return;
    try {
      const results = await Promise.allSettled(
        selected.map((s) =>
          authenticatedRequest("/api/employee/post_shift", {
            method: "POST",
            body: { shift_id: s.id },
          })
        )
      );

      const ok = results.filter(r => r.status === "fulfilled").length;
      const fail = results.length - ok;

      if (ok > 0) {
        alert(`Posted ${ok} shift${ok === 1 ? "" : "s"}${fail ? ` (${fail} failed)` : ""}.`);

        // Remove posted shifts from calendar
        const postedIds = selected.map(s => s.id);
        setEvents(prev => prev.filter(evt => !postedIds.includes(evt.id)));

        setSelected([]);
      } else {
        alert("Failed to post selected shifts.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to post shifts.");
    }
  }, [selected]);

  // Style selected shifts blue; others gray
  const eventPropGetter = useCallback(
    (event) => {
      const isSelected = selected.some((s) => s.id === event.id);
      return {
        style: {
          backgroundColor: isSelected ? "#0d6efd" : "#8aa9d9",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "2px 4px",
          fontSize: "0.85em",
        },
      };
    },
    [selected]
  );

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
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        padding: 16,
        background: "transparent",
      }}
    >
      {/* HEADER */}
      <header style={styles.header}>
          <div style={{ ...styles.headerLeft, cursor: "pointer" }}
             onClick={() => navigate("/employee-home")}
        >
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


      {/* MAIN LAYOUT: LEFT NAV + MAIN */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: 20,
          height: `calc(100vh - ${HEADER_HEIGHT + 32}px)`,
        }}
      >
        {/* LEFT NAVIGATION */}
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
                <div style={{ fontWeight: 700, color: '#666'  }}>My pay</div>
              </div>
            </div>
          </div>

          {loading && <div style={{ marginTop: 12, color: '#666', fontSize: 13 }}>Loading shifts…</div>}
        </aside>

        {/* RIGHT SIDE — ORIGINAL UI (UNCHANGED) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `${LEFT_PANEL_WIDTH}px 1fr`,
            gap: 16,
            height: "100%",
            alignItems: "stretch",
          }}
        >
          {/* LEFT: Selected shifts */}
          <aside
            style={{
              background: "rgba(255,255,255,0.98)",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontWeight: 800, color: "#222" }}>Selected Shifts</div>
              <div style={{ fontSize: 13, color: "#666" }}>{selected.length}</div>
            </div>

            <div style={{ margin: "10px 0", height: 1, background: "#eee" }} />

            <div style={{ overflow: "auto", display: "grid", gap: 10 }}>
              {selected.length === 0 && (
                <div style={{ color: "#777", fontSize: 14 }}>
                  Click shifts in the calendar to add them here.
                </div>
              )}
              {selected.map((s) => (
                <SelectedShiftCard key={s.id} shift={s} onRemove={removeSelected} />
              ))}
            </div>

            <div style={{ marginTop: "auto", display: "grid", gap: 8 }}>
              <button
                type="button"
                onClick={postSelected}
                disabled={selected.length === 0}
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: selected.length ? "#0d6efd" : "#9fb8ef",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: selected.length ? "pointer" : "not-allowed",
                }}
              >
                Post {selected.length || ""} Shift{selected.length === 1 ? "" : "s"}
              </button>
              <button
                type="button"
                onClick={clearSelected}
                disabled={selected.length === 0}
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #ddd",
                  background: "#fff",
                  color: "#333",
                  fontWeight: 600,
                  cursor: selected.length ? "pointer" : "not-allowed",
                }}
              >
                Clear
              </button>
            </div>
          </aside>

          {/* RIGHT: Big calendar */}
          <section
            style={{
              background: "rgba(255,255,255,0.98)",
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              padding: 12,
              overflow: "hidden",
            }}
          >
            <style>{`
              .post-calendar .rbc-header {
                color: #222 !important;
                background: transparent !important;
                font-weight: 700;
              }
              .post-calendar .rbc-header a {
                color: #222 !important;
                text-decoration: none;
              }
              .post-calendar .rbc-month-view .rbc-date-cell {
                color: #222 !important;
              }
            `}</style>

            <BigCalendar
              className="post-calendar"
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="month"
              views={["month"]}
              date={today}
              toolbar={true}
              style={{ height: calendarHeight, width: "100%" }}
              popup
              selectable={false}
              onSelectEvent={onSelectEvent}
              eventPropGetter={eventPropGetter}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
