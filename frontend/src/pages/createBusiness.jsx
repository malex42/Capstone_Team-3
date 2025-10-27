import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedRequest } from "@/lib/api"; // adjust if your API helper differs
import "../styles/createBusiness.css";               // optional extra styles

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// helper: keep HH 0–23, MM 0–59
const clamp = (v, min, max) => Math.max(min, Math.min(max, v ?? 0));
const toInt = (v) => Number.isFinite(+v) ? parseInt(v, 10) : 0;

export default function CreateBusiness() {
  const navigate = useNavigate();

  // top fields
  const [appName] = useState("Good Work");            // banner / title
  const [businessName, setBusinessName] = useState("");
  const [businessCode, setBusinessCode] = useState("");  // optional internal code when creating

  // link existing
  const [linkCode, setLinkCode] = useState("");

  // hours state
  const [hours, setHours] = useState(
    DAYS.map((day) => ({
      day,
      enabled: false,
      openHH: "", openMM: "",
      closeHH: "", closeMM: "",
    }))
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const disabledSubmit = useMemo(() => {
    if (!businessName.trim() && !linkCode.trim()) return true; // need either create or link
    return false;
  }, [businessName, linkCode]);

  const onToggleDay = (i, checked) => {
    setHours((prev) => {
      const next = [...prev];
      next[i].enabled = checked;
      return next;
    });
  };

  const onTimeChange = (i, field, value) => {
    setHours((prev) => {
      const next = [...prev];
      // keep only numbers; allow empty for easy typing
      const sanitized = value === "" ? "" : value.replace(/\D+/g, "");
      next[i][field] = sanitized;
      return next;
    });
  };

  // simple validation for HH:MM ranges & open < close (same-day)
  const validate = () => {
    if (linkCode.trim()) return { ok: true }; // linking path only

    if (!businessName.trim()) {
      return { ok: false, msg: "Business name is required (or provide a link code)." };
    }
    const enabledDays = hours.filter((d) => d.enabled);
    if (enabledDays.length === 0) {
      return { ok: false, msg: "Select at least one day and provide open/close times." };
    }
    for (const d of enabledDays) {
      if (
        d.openHH === "" || d.openMM === "" ||
        d.closeHH === "" || d.closeMM === ""
      ) {
        return { ok: false, msg: `Please fill times for ${d.day}.` };
      }
      const oh = clamp(toInt(d.openHH), 0, 23);
      const om = clamp(toInt(d.openMM), 0, 59);
      const ch = clamp(toInt(d.closeHH), 0, 23);
      const cm = clamp(toInt(d.closeMM), 0, 59);
      const openMin = oh * 60 + om;
      const closeMin = ch * 60 + cm;
      if (openMin >= closeMin) {
        return { ok: false, msg: `Close time must be after open time on ${d.day}.` };
      }
    }
    return { ok: true };
  };

  const payloadForCreate = () => {
    // convert to HH:MM 24h strings only for enabled days
    const schedule = hours
      .filter((d) => d.enabled)
      .map((d) => ({
        day: d.day,
        open: `${String(clamp(toInt(d.openHH), 0, 23)).padStart(2, "0")}:${String(clamp(toInt(d.openMM), 0, 59)).padStart(2, "0")}`,
        close: `${String(clamp(toInt(d.closeHH), 0, 23)).padStart(2, "0")}:${String(clamp(toInt(d.closeMM), 0, 59)).padStart(2, "0")}`,
      }));

    return {
      name: businessName.trim(),
      code: businessCode.trim() || undefined, // optional
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
      if (linkCode.trim()) {
        // LINK EXISTING BUSINESS
        await authenticatedRequest("/api/business/link", {
          method: "POST",
          body: { code: linkCode.trim() },
        });
      } else {
        // CREATE NEW BUSINESS
        await authenticatedRequest("/api/business", {
          method: "POST",
          body: payloadForCreate(),
        });
      }
      // navigate to home on success
      navigate("/");
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center">
      <div className="container" style={{ maxWidth: 900 }}>
        {/* Application Name Banner */}
        <h1 className="display-6 text-center mb-4">{appName}</h1>

        <div className="card shadow-sm border-0">
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>

              {/* Top Row: New Business + Link Business */}
              <div className="row g-3 align-items-end">
                <div className="col-md-8">
                  <label className="form-label fw-semibold">
                    New Business <span className="text-danger">*</span>
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Business Name"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    disabled={!!linkCode.trim()}
                  />
                  <div className="form-text">Enter a name to create a new business.</div>
                </div>

                <div className="col-md-4">
                  <label className="form-label fw-semibold">Or Link a Business</label>
                  <div className="input-group">
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Linking Code"
                      value={linkCode}
                      onChange={(e) => setLinkCode(e.target.value)}
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => !disabledSubmit && handleSubmit(new Event("submit"))}
                      disabled={!linkCode.trim() || submitting}
                      title="Link"
                    >
                      →
                    </button>
                  </div>
                  <div className="form-text">Have a code? Link to an existing business.</div>
                </div>
              </div>

              {/* Optional internal Business Code when creating */}
              <div className="row g-3 mt-3">
                <div className="col-md-6">
                  <label className="form-label">Business Code (optional)</label>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Internal code for your business"
                    value={businessCode}
                    onChange={(e) => setBusinessCode(e.target.value)}
                    disabled={!!linkCode.trim()}
                  />
                </div>
              </div>

              {/* Hours of Operation */}
              <h5 className="fw-bold mt-4 mb-3">Hours of Operation</h5>
              <div className="table-responsive">
                <table className="table table-bordered align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Day</th>
                      <th className="text-center" style={{ width: 240 }}>Open (HH:MM)</th>
                      <th className="text-center" style={{ width: 240 }}>Close (HH:MM)</th>
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
                              disabled={!!linkCode.trim()}
                            />
                            <label className="form-check-label" htmlFor={`day-${d.day}`}>
                              {d.day}
                            </label>
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="HH"
                              min={0}
                              max={23}
                              value={d.openHH}
                              onChange={(e) => onTimeChange(i, "openHH", e.target.value)}
                              disabled={!d.enabled || !!linkCode.trim()}
                            />
                            <span className="fs-5">:</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="MM"
                              min={0}
                              max={59}
                              value={d.openMM}
                              onChange={(e) => onTimeChange(i, "openMM", e.target.value)}
                              disabled={!d.enabled || !!linkCode.trim()}
                            />
                          </div>
                        </td>

                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="HH"
                              min={0}
                              max={23}
                              value={d.closeHH}
                              onChange={(e) => onTimeChange(i, "closeHH", e.target.value)}
                              disabled={!d.enabled || !!linkCode.trim()}
                            />
                            <span className="fs-5">:</span>
                            <input
                              type="number"
                              className="form-control"
                              placeholder="MM"
                              min={0}
                              max={59}
                              value={d.closeMM}
                              onChange={(e) => onTimeChange(i, "closeMM", e.target.value)}
                              disabled={!d.enabled || !!linkCode.trim()}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Errors */}
              {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

              {/* Submit */}
              <div className="text-end mt-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}
