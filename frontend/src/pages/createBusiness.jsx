// src/pages/CreateBusiness.jsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedRequest, saveToken } from '@/lib/api';

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// utils
const clamp = (v, min, max) => Math.max(min, Math.min(max, v ?? 0));
const toInt = (v) => Number.isFinite(+v) ? parseInt(v, 10) : 0;
const to24 = (h12, mer) => {
  const h = clamp(toInt(h12), 1, 12) || 12;
  return mer === "AM" ? (h % 12) : ((h % 12) + 12);
};

export default function CreateBusiness() {
  const navigate = useNavigate();

  // left column
  const [businessName, setBusinessName] = useState("");
  const [businessCode, setBusinessCode] = useState("");

  // right column (hours)
  const [hours, setHours] = useState(
    DAYS.map(day => ({
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
    setHours(prev => {
      const next = [...prev];
      next[i].enabled = checked;
      return next;
    });

  const onTimeChange = (i, field, value) =>
    setHours(prev => {
      const next = [...prev];
      next[i][field] = value === "" ? "" : value.replace(/\D+/g, "");
      return next;
    });

  const onMerChange = (i, field, value) =>
    setHours(prev => {
      const next = [...prev];
      next[i][field] = value;
      return next;
    });

  const validate = () => {
    if (!businessName.trim()) return { ok:false, msg:"Business name is required." };
    const enabled = hours.filter(d => d.enabled);
    if (enabled.length === 0) return { ok:false, msg:"Select at least one day and fill times." };

    for (const d of enabled) {
      if (d.open12 === "" || d.openMM === "" || d.close12 === "" || d.closeMM === "")
        return { ok:false, msg:`Please fill times for ${d.day}.` };

      const oh = to24(d.open12, d.openMer);
      const ch = to24(d.close12, d.closeMer);
      const om = clamp(toInt(d.openMM), 0, 59);
      const cm = clamp(toInt(d.closeMM), 0, 59);

      if (oh * 60 + om >= ch * 60 + cm)
        return { ok:false, msg:`Close time must be after open time on ${d.day}.` };
    }
    return { ok:true };
  };

  const payloadForCreate = () => ({
    name: businessName.trim(),
    hours: hours.filter(d => d.enabled).map(d => {
      const oh = to24(d.open12, d.openMer);
      const ch = to24(d.close12, d.closeMer);
      const om = clamp(toInt(d.openMM), 0, 59);
      const cm = clamp(toInt(d.closeMM), 0, 59);
      return {
        day: d.day,
        open: `${String(oh).padStart(2,"0")}:${String(om).padStart(2,"0")}`,
        close:`${String(ch).padStart(2,"0")}:${String(cm).padStart(2,"0")}`,
      };
    }),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { ok, msg } = validate();
    if (!ok) { setError(msg); return; }

    setSubmitting(true);
    try {
      const data = await authenticatedRequest("/api/manager/new/business", {
        method: "POST",
        body: payloadForCreate(),
      });

      if (data?.code) {
        localStorage.setItem("business_code", data.code);
      }
      if (data?.JWT) {
          saveToken(data.JWT)
          }

      navigate("/manager-home");
    } catch (err) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ NEW: Link existing business handler
  const handleLinkBusiness = async (e) => {
    e.preventDefault();
    setError("");

    if (!businessCode.trim()) {
      setError("Please enter a business code to link.");
      return;
    }

    setSubmitting(true);
    try {
      const data = await authenticatedRequest("/api/link_business", {
        method: "POST",
        body: { code: businessCode.trim() },
      });
      if (data?.JWT) {
          saveToken(data.JWT)
          }
      localStorage.setItem("businessCode", businessCode.trim());

      navigate("/manager-home");
    } catch (err) {
      setError(err?.message || "Failed to link business.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- layout styles ----------
  const styles = {
    page: { background:"#fafafa", minHeight:"100vh", padding:"24px 16px" },
    bigBox: {
      maxWidth: 1280, margin:"0 auto", background:"#fff", borderRadius:16,
      boxShadow:"0 8px 24px rgba(16,24,40,.08)", padding:"24px 28px"
    },
    grid: {
      display:"grid",
      gridTemplateColumns:"minmax(360px, 420px) 1fr",
      gap:32, alignItems:"start"
    },
    logo: { width: 160, height: "auto", objectFit:"contain", display:"block", marginBottom:16 },
    sectionTitle: { fontWeight:700, fontSize:18, margin:"8px 0 12px" },
    hoursCellInput: { maxWidth:72 },
    hoursCellSelect: { maxWidth:88 },
  };

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const set = () => setIsNarrow(window.innerWidth < 992);
    set(); window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, []);

  return (
    <main style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.bigBox}>
        <div style={isNarrow ? { display:"grid", gap:24 } : styles.grid}>

          {/* LEFT */}
          <section>
            <img src="/img/logo.png" alt="goodWorks" style={styles.logo} />

            <h6 style={styles.sectionTitle}>Business</h6>

            <div className="mb-3">
              <label className="form-label">
                Business Name <span className="text-danger">*</span>
              </label>
              <input
                className="form-control"
                placeholder="e.g., Pacific Poke & Grill"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Or link an existing business
              </label>

              <div className="d-flex gap-2">
                <input
                  className="form-control"
                  placeholder="Enter business code"
                  value={businessCode}
                  onChange={(e) => setBusinessCode(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleLinkBusiness}
                  disabled={submitting || !businessCode.trim()}
                >
                  {submitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Linking…</>
                  ) : (
                    "Link"
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <aside>
            <h6 style={styles.sectionTitle}>Hours of Operation</h6>

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

                      <td>
                        <div className="d-flex align-items-center gap-2 justify-content-center">
                          <input
                            type="text" inputMode="numeric" maxLength={2}
                            className="form-control" placeholder="HH"
                            style={styles.hoursCellInput}
                            value={d.open12}
                            onChange={(e) => onTimeChange(i, "open12", e.target.value)}
                            disabled={!d.enabled}
                          />
                          <span>:</span>
                          <input
                            type="text" inputMode="numeric" maxLength={2}
                            className="form-control" placeholder="MM"
                            style={styles.hoursCellInput}
                            value={d.openMM}
                            onChange={(e) => onTimeChange(i, "openMM", e.target.value)}
                            disabled={!d.enabled}
                          />
                          <select
                            className="form-select" style={styles.hoursCellSelect}
                            value={d.openMer}
                            onChange={(e) => onMerChange(i, "openMer", e.target.value)}
                            disabled={!d.enabled}
                          >
                            <option>AM</option><option>PM</option>
                          </select>
                        </div>
                      </td>

                      <td>
                        <div className="d-flex align-items-center gap-2 justify-content-center">
                          <input
                            type="text" inputMode="numeric" maxLength={2}
                            className="form-control" placeholder="HH"
                            style={styles.hoursCellInput}
                            value={d.close12}
                            onChange={(e) => onTimeChange(i, "close12", e.target.value)}
                            disabled={!d.enabled}
                          />
                          <span>:</span>
                          <input
                            type="text" inputMode="numeric" maxLength={2}
                            className="form-control" placeholder="MM"
                            style={styles.hoursCellInput}
                            value={d.closeMM}
                            onChange={(e) => onTimeChange(i, "closeMM", e.target.value)}
                            disabled={!d.enabled}
                          />
                          <select
                            className="form-select" style={styles.hoursCellSelect}
                            value={d.closeMer}
                            onChange={(e) => onMerChange(i, "closeMer", e.target.value)}
                            disabled={!d.enabled}
                          >
                            <option>AM</option><option>PM</option>
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

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        <div className="text-end mt-3">
          <button
            type="submit"
            className="btn btn-primary px-4"
            disabled={disabledSubmit || submitting}
          >
            {submitting ? (
              <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
            ) : (
              "Create"
            )}
          </button>
        </div>
      </form>
    </main>
  );
}
