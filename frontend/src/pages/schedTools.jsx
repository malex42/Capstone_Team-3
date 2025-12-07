import React, { useEffect, useMemo, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/styles/homePage.css';
import '@/styles/auth.css';

import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { ObjectId } from 'bson';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import { getHomePage, getBusinessCode, authenticatedRequest } from '@/lib/api';
import { useNavigate } from "react-router-dom";
import { useConnectivity } from '@/contexts/ConnectivityContext';


const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function ManagerScheduleEditor() {
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('-');
  const businessCode = getBusinessCode();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [shiftStart, setShiftStart] = useState('');
  const [shiftEnd, setShiftEnd] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [editingShift, setEditingShift] = useState(null);
  const isEditing = Boolean(editingShift?._id);
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [schedules, setSchedules] = useState([]);
  const { isOffline } = useConnectivity();

  const canEditShifts = Boolean(scheduleId);
  const canEdit = canEditShifts && !isOffline;


  const HEADER_HEIGHT = 84;
  const LEFT_NAV_WIDTH = 260;
    const navItems = [
      { icon: "calenderIcon.png", label: "Schedules", path: "/schedules" },
      { icon: "monitorActivityIcon.png", label: "Monitor", path: "/monitoring" },
      { icon: "alertIcon.png", label: "Alerts" },
      { icon: "accountIcon.png", label: "Account" },
      { icon: "myPayIcon.png", label: "Payroll" },
    ];
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
            style={{ position: "fixed", top, left, zIndex: -9999, pointerEvents: "none" }}
          >
            <i />
          </div>
        ))}
      </>
    );
  }

  const scheduleExists = (year, month) => schedules.some(s => s.year === year && s.month === month);

  const dayPropGetter = (date) => ({
    style: date.toDateString() === selectedDate.toDateString()
      ? { background: 'rgba(0, 123, 255, 0.25)', borderRadius: '6px' }
      : {}
  });

  const exitShiftEditor = async () => {
    try {
    if (!isOffline) {
      await refreshSchedule();
    } else {
      console.warn("Offline: skipping schedule refresh");
    }
  } catch (err) {
    console.error("Failed to refresh schedule:", err);
  } finally {
    setEditingShift(null);
    setShowShiftEditor(false);
    setShiftStart('');
    setShiftEnd('');
    setSelectedEmployee('');
  }
};

  const createSchedule = async (year, month) => {
    await authenticatedRequest("/api/manager/schedules/new", {
      method: "POST",
      body: { year, month }
    });
    setSchedules(prev => [...prev, { year, month }]);
  };

  const refreshSchedule = async () => {
    try {
      const data = await getHomePage();

      if (!data.schedule_id) {
        await createSchedule(viewYear, viewMonth);
        return refreshSchedule();
      }

      setScheduleId(data.schedule_id);
      setBusinessName(data.business_name || '');

      const mapped = (data.shifts || []).map((s, idx) => {
        const start = new Date(s.start);
        const end = new Date(s.end);
        return {
          id: s._id ?? idx,
          _id: s._id,
          employee_id: s.employee_id,
          title: `${(s.employee_name ?? '').slice(0,10).toUpperCase()}: ${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
          start,
          end,
          allDay: false,
        };
      });

      setEvents(mapped);
    } catch (err) {
      console.error("Failed to refresh schedule:", err);
    }
  };

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const data = await authenticatedRequest("/api/manager/schedules");
        setSchedules(data.schedules || []);
      } catch (err) {
        console.error("Failed to load schedules:", err);
      }
    };
    loadSchedules();
  }, []);

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
    refreshSchedule().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showShiftEditor) return;
    async function fetchEmployees() {
      try {
        const data = await authenticatedRequest('/api/manager/business/employees');
        if (!Array.isArray(data)) {
          console.warn('Employees response invalid, keeping previous state.');
          return;
        }
        setEmployees(data);
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    }
    fetchEmployees();
  }, [showShiftEditor]);

  const eventsForSelectedDate = events.filter(e => new Date(e.start).toDateString() === selectedDate.toDateString());

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
        <div style={{ ...styles.headerLeft, cursor: "pointer" }} onClick={() => navigate("/manager-home")}>
          <img src="/img/logo.png" alt="Logo" style={{ width: 90, height: 90, objectFit: "contain" }} />
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
            {navItems.map((item) => (
              <div
                key={item.label}
                style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 6px', borderRadius: 8, cursor: item.path ? 'pointer' : 'default' }}
                onClick={() => item.path && navigate(item.path)}
              >
                <img style={{ width: 36, height: 36, objectFit: 'contain' }} src={`/img/${item.icon}`} alt={item.label} />
                <div><div style={{ fontWeight: 700, color: '#666' }}>{item.label}</div></div>
              </div>
            ))}
            {loading && <div style={{ marginTop: 12, color: '#666', fontSize: 13 }}>Loading shifts…</div>}
          </div>
        </aside>

        {/* Left Panel */}
        <div style={styles.detailsPanel}>
          {showShiftEditor ? (
            <div style={styles.panelCard}>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 12 }}>
                {editingShift ? 'Edit Shift' : 'Add Shift'}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <label>Start Time</label>
                      <input
                        type="time"
                        value={shiftStart}
                        onChange={(e) => setShiftStart(e.target.value)}
                        style={{ padding: '6px', borderRadius: 6, border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
                      />

                      <label>End Time</label>
                      <input
                        type="time"
                        value={shiftEnd}
                        onChange={(e) => setShiftEnd(e.target.value)}
                        style={{ padding: '6px', borderRadius: 6, border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
                      />

                      <label>Employee</label>
                      <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        style={{ padding: '6px', borderRadius: 6, border: '1px solid #ccc', backgroundColor: '#fff', color: '#000' }}
                      >
                        <option value="">Select Employee</option>
                        {employees.map(emp => (
                          <option key={emp.employee_id} value={emp.employee_id}>
                            {emp.name || emp.username || 'Unnamed'}
                          </option>
                        ))}
                      </select>

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  onClick={async () => {
                    if (!canEdit) return;
                    try {
                      const shift = {
                        employee_id: selectedEmployee,
                        start: new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${shiftStart}:00`).toISOString(),
                        end: new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${shiftEnd}:00`).toISOString(),
                      };
                      if (isEditing) shift._id = editingShift._id;

                      const url = isEditing ? '/api/manager/schedules/edit_shift' : '/api/manager/schedules/add_shift';
                      await authenticatedRequest(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: { schedule_id: scheduleId, shift } });
                      await exitShiftEditor();
                    } catch (err) { console.error(err); }
                  }}
                  style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: '#28a745', color: '#fff', fontWeight: 600, border: 'none', cursor: canEdit ? 'pointer' : 'not-allowed' }}
                  disabled={!canEdit}
                >Save</button>

                <button
                  onClick={async () => {
                    if (!isEditing) {
                      await exitShiftEditor();
                      return;
                    }

                    try {
                      // Only attempt deletion if online
                      if (!isOffline) {
                        await authenticatedRequest('/api/manager/schedules/delete_shift', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: { schedule_id: scheduleId, shift_id: editingShift._id },
                        });
                      } else {
                        console.warn('Offline: skip API deletion');
                      }
                    } catch (err) {
                      console.error('Failed to delete shift:', err);
                    } finally {
                      // Always exit the editor, regardless of success/failure
                      await exitShiftEditor();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#dc3545',
                    color: '#fff',
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
              </div>
            </div>
          ) : (
            <>
              <div style={styles.panelCard}>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                  {format(selectedDate, 'eeee, LLLL d, yyyy')}
                </div>

                {eventsForSelectedDate.length === 0 ? (
                  <div style={{ color: '#666' }}>No shifts for this date.</div>
                ) : (
                  eventsForSelectedDate.map(e => (
                    <div key={e.id} style={{ padding: '6px 8px', borderRadius: 6, background: '#007bff', color: '#fff', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{e.title}</span>
                      <button
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 4, padding: '2px 6px', color: '#fff', cursor: canEdit ? 'pointer' : 'not-allowed' }}
                        disabled={!canEdit}
                        onClick={() => {
                          if (!canEdit) return;
                          setShowShiftEditor(true);
                          setEditingShift(e);
                          setSelectedEmployee(e.employee_id);
                          setShiftStart(format(new Date(e.start), 'HH:mm'));
                          setShiftEnd(format(new Date(e.end), 'HH:mm'));
                        }}
                      >Edit</button>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.buttonContainer}>
                <button onClick={() => canEdit && setShowShiftEditor(true)}
                        style={{ padding: '10px 12px', borderRadius: 8, background: '#28a745', color: '#fff', fontWeight: 600, border: 'none', cursor: canEdit ? 'pointer' : 'not-allowed' }}
                        disabled={!canEdit}
                >Add Shift</button>
              </div>
            </>
          )}
        </div>

        {/* Calendar */}
        <main style={styles.calendarContainer}>
          <div style={styles.calendarCard}>
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
              dayPropGetter={dayPropGetter}
              selectable
              onSelectSlot={(slotInfo) => setSelectedDate(slotInfo.start)}
              onSelectEvent={(event) => setSelectedDate(new Date(event.start))}
              toolbar
              style={{ width: '100%', height: '100%' }}
              onNavigate={async (date) => {
                const year = date.getFullYear();
                const month = date.getMonth() + 1;
                setSelectedDate(date);
                setViewMonth(month);
                setViewYear(year);

                if (!scheduleExists(year, month)) await createSchedule(year, month);
                await refreshSchedule();
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
