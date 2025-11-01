// src/pages/CreateBusiness.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedRequest } from "@/lib/api";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// helpers
const clamp = (v, min, max) => Math.max(min, Math.min(max, v ?? 0));
const toInt = (v) => Number.isFinite(+v) ? parseInt(v, 10) : 0;
const to24 = (h12, mer) => {
  const h = clamp(toInt(h12), 1, 12);
  if (!Number.isFinite(h)) return 0;
  if (mer === "AM") return h % 12;   // 12AM -> 0
  return (h % 12) + 12;              // 12PM -> 12
};

export default function CreateBusiness() {
  const navigate = useNavigate();

  // left column fields
  const [businessName, setBusinessName] = useState("");
  const [businessCode, setBusinessCode] = useState("");

  // hours state (right column)
  const [hours, setHours] = useState(
    DAYS.map((day) => ({
      day,
      enabled: false,
      open12: "", openMM: "", openMer: "AM",
      close12: "", closeMM: "", closeMer: "PM",
    }))
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const disabledSubmit = useMemo(() => !businessName.trim(), [businessName]);

  const onToggleDay = (i, checked) =>
    setHours((prev) => {
      const next = [...prev];
      next[i].enabled = checked;
      return next;
    });

  const onTimeChange = (i, field, value) =>
    setHours((prev) => {
      const next = [...prev];
      const sanitized = value === "" ? "" : value.replace(/\D+/g, "");
      next[i][field] = sanitized;
      return next;
    });

  const onMerChange = (i, field, value) =>
    setHours((prev) => {
      const next = [...prev];
      next[i][field] = value; // "AM" | "PM"
      return next;
    });

  const validate = () => {
    if (!businessName.trim()) return { ok: false, msg: "Business name is required." };

    const enabledDays = hours.filter((d) => d.enabled);
    if (enabledDays.length === 0) return { ok: false, msg: "Select at least one day and fill times." };

    for (const d of enabledDays) {
      if (d.open12 === "" || d.openMM === "" || d.close12 === "" || d.closeMM === "")
        return { ok: false, msg: `Please fill times for ${d.day}.` };

      const oh = to24(d.open12, d.openMer);
      const ch = to24(d.close12, d.closeMer);
      const om = clamp(toInt(d.openMM), 0, 59);
      const cm = clamp(toInt(d.closeMM), 0, 59);

      const openMin = oh * 60 + om;
      const closeMin = ch * 60 + cm;
      if (openMin >= closeMin)
        return { ok: false, msg: `Close time must be after open time on ${d.day}.` };
    }
    return { ok: true };
  };

  const payloadForCreate = () => {
    const schedule = hours
      .filter((d) => d.enabled)
      .map((d) => {
        const oh = to24(d.open12, d.openMer);
        const ch = to24(d.close12, d.closeMer);
        const om = clamp(toInt(d.openMM), 0, 59);
        const cm = clamp(toInt(d.closeMM), 0, 59);
        return {
          day: d.day,
          open: `${String(oh).padStart(2, "0")}:${String(om).padStart(2, "0")}`,
          close: `${String(ch).padStart(2, "0")}:${String(cm).padStart(2, "0")}`,
        };
      });

    return {
      name: businessName.trim(),
      code: businessCode.trim() || undefined,
      hours: schedule,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { ok, msg } = validate();
    if (!ok) {
      setError(msg);
      return;
    }

    setSubmitting(true);
    try {
      await authenticatedRequest("/api/business", {
        method: "POST",
        body: payloadForCreate(),
      });
      navigate("/");
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // Simple, inline styles for the “big box” two-column layout (stacks on small screens)
  const pageStyle = { background: "#f5f7fb", minHeight: "100vh", padding: "32px 16px" };
  const bigBox = {
    maxWidth: 1120,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(16,24,40,.08)",
    padding: "24px 24px 28px",
  };
  const grid = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 24,
  };
  const gridLg = {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: 32,
  };

  // simple responsive switch: use 2 cols at >= 992px
  const isWide = typeof window !== "undefined" ? window.innerWidth >= 992 : true;

  return (
    <main style={pageStyle}>
      <form onSubmit={handleSubmit} style={bigBox}>
        <div style={isWide ? gridLg : grid}>
          {/* LEFT: Business name & code */}
          <section>
            <h4 className="mb-3">New Business</h4>

            <div className="mb-3">
              <label className="form-label">
                Name <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                placeholder="e.g., Pacific Poke & Grill"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Business Code (optional)</label>
              <input
                className="form-control"
                placeholder="Internal code"
                value={businessCode}
                onChange={(e) => setBusinessCode(e.target.value)}
              />
            </div>
          </section>

          {/* RIGHT: Hours of Operation */}
          <aside>
            <h4 className="mb-3">Hours of Operation</h4>

            <div className="table-responsive">
              <table className="table table-bordered align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Day</th>
                    <th className="text-center">Open</th>
                    <th className="text-center">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {hours.map((d, i) => (
                    <tr key={d.day}>
                      <td>
                        <div className="form-check">
                          <input
                            id={`day-${d.day}`}
                            className="form-check-input me-2"
                            type="checkbox"
                            checked={d.enabled}
                            onChange={(e) => onToggleDay(i, e.target.checked)}
                          />
                          <label className="form-check-label" htmlFor={`day-${d.day}`}>
                            {d.day}
                          </label>
                        </div>
                      </td>

                      {/* Open */}
                      <td>
                        <div className="d-flex align-items-center gap-2 justify-content-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-control"
                            placeholder="HH"
                            maxLength={2}
                            value={d.open12}
                            onChange={(e) => onTimeChange(i, "open12", e.target.value)}
                            disabled={!d.enabled}
                            style={{ maxWidth: 72 }}
                          />
                          <span>:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-control"
                            placeholder="MM"
                            maxLength={2}
                            value={d.openMM}
                            onChange={(e) => onTimeChange(i, "openMM", e.target.value)}
                            disabled={!d.enabled}
                            style={{ maxWidth: 72 }}
                          />
                          <select
                            className="form-select"
                            value={d.openMer}
                            onChange={(e) => onMerChange(i, "openMer", e.target.value)}
                            disabled={!d.enabled}
                            style={{ maxWidth: 88 }}
                          >
                            <option>AM</option>
                            <option>PM</option>
                          </select>
                        </div>
                      </td>

                      {/* Close */}
                      <td>
                        <div className="d-flex align-items-center gap-2 justify-content-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-control"
                            placeholder="HH"
                            maxLength={2}
                            value={d.close12}
                            onChange={(e) => onTimeChange(i, "close12", e.target.value)}
                            disabled={!d.enabled}
                            style={{ maxWidth: 72 }}
                          />
                          <span>:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            className="form-control"
                            placeholder="MM"
                            maxLength={2}
                            value={d.closeMM}
                            onChange={(e) => onTimeChange(i, "closeMM", e.target.value)}
                            disabled={!d.enabled}
                            style={{ maxWidth: 72 }}
                          />
                          <select
                            className="form-select"
                            value={d.closeMer}
                            onChange={(e) => onMerChange(i, "closeMer", e.target.value)}
                            disabled={!d.enabled}
                            style={{ maxWidth: 88 }}
                          >
                            <option>AM</option>
                            <option>PM</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </aside>
        </div>

        {/* Errors + Submit */}
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        <div className="text-end mt-3">
          <button
            type="submit"
            className="btn btn-primary px-4"
            disabled={disabledSubmit || submitting}
            title="Continue"
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving…
              </>
            ) : (
              "Continue →"
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
