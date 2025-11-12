import React, { useEffect, useMemo, useState, useCallback } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";

import { authenticatedRequest, getHomePage } from "@/lib/api"; // reuse your existing API helpers

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

export default function PostShifts() {
  // Right calendar data (all employees’ shifts)
  const [events, setEvents] = useState([]);     // { id, title, start, end, employee_id, employee_name }
  const [loading, setLoading] = useState(true);

  // Left panel (selected by the user)
  const [selected, setSelected] = useState([]);

  // Month lock like your other page
  const today = useMemo(() => new Date(), []);

  // Layout sizing
  const HEADER_HEIGHT = 76;
  const LEFT_PANEL_WIDTH = 320;
  const [calendarHeight, setCalendarHeight] = useState(600);

  // Fetch shifts (all employees)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getHomePage(); // you already return business_name and shifts here
        if (!mounted) return;

        const mapped = (data.shifts || []).map((s, idx) => {
          const start = new Date(s.start);
          const end = new Date(s.end);
          const title = `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${s.employee_name ? ` • ${s.employee_name}` : ""}`;

          return {
            id: s._id || idx,
            title,
            start,
            end,
            employee_id: s.employee_id,
            employee_name: s.employee_name,
            raw: s,
          };
        });

        setEvents(mapped);
      } catch (e) {
        console.error("Failed to load shifts for Post Shifts:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
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

  // Optional: post selected shifts to API (e.g., to a marketplace/board)
  const postSelected = useCallback(async () => {
    if (selected.length === 0) return;
    try {
      const payload = { shift_ids: selected.map((s) => s.id) };
      await authenticatedRequest("/api/post_shifts", {
        method: "POST",
        body: payload,
      });
      // You could show a toast; here we just clear the selection
      clearSelected();
      alert("Shifts posted!");
    } catch (e) {
      console.error(e);
      alert("Failed to post shifts.");
    }
  }, [selected, clearSelected]);

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
      {/* Header */}
      <div
        style={{
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 16px",
          borderRadius: 10,
          background: "rgba(255,255,255,0.97)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        }}
      >
        <img src="/img/logo.png" alt="GoodWork" style={{ width: 64, height: 64, objectFit: "contain" }} />
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Post Shifts</h1>
        <div style={{ marginLeft: "auto", color: "#666", fontSize: 14 }}>
          {loading ? "Loading…" : `${events.length} total shifts`}
        </div>
      </div>

      {/* Main split: left selected panel, right calendar */}
      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: `${LEFT_PANEL_WIDTH}px 1fr`,
          gap: 16,
          height: `calc(100vh - ${HEADER_HEIGHT + 28}px)`,
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
  );
}
