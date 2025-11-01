// frontend/src/pages/createBusiness.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedRequest } from "@/lib/api";
import "../styles/createBusiness.css";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const clamp = (v, min, max) => Math.max(min, Math.min(max, v ?? 0));
const toInt = (v) => Number.isFinite(+v) ? parseInt(v, 10) : 0;

export default function CreateBusiness() {
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState("");
  const [businessCode, setBusinessCode] = useState("");

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

  const disabledSubmit = useMemo(() => !businessName.trim(), [businessName]);

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
      const sanitized = value === "" ? "" : value.replace(/\D+/g, "");
      next[i][field] = sanitized;
      return next;
    });
  };

  const validate = () => {
    if (!businessName.trim()) {
      return { ok: false, msg: "Business name is required." };
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
    const schedule = hours
      .filter((d) => d.enabled)
      .map((d) => ({
        day: d.day,
        open: `${String(clamp(toInt(d.openHH), 0, 23)).padStart(2, "0")}:${String(clamp(toInt(d.openMM), 0, 59)).padStart(2, "0")}`,
        close: `${String(clamp(toInt(d.closeHH), 0, 23)).padStart(2, "0")}:${String(clamp(toInt(d.closeMM), 0, 59)).padStart(2, "0")}`,
      }));

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
    if (!ok) { setError(msg); return; }

    setSubmitting(true);
    try {
      // align with backend route in server/routes/routes.py
      await authenticatedRequest("/api/manager/new/business", {
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

  // compact “more horizontal” layout: name + code on a row; hours as a dense grid
  return (
    <div className="container py-4" style={{maxWidth: 1000}}>
      <img src="/img/logo.png" alt="Logo" className="img-fluid mx-auto d-block mb-3"/>
      <form onSubmit={handleSubmit} className="card shadow-sm p-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-7">
            <label className="form-label fw-semibold">Business Name *</label>
            <input
              className="form-control"
              type="text"
              placeholder="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div className="col-md-5">
            <label className="form-label fw-semibold">Business Code (optional)</label>
            <input
              className="form-control"
              type="text"
              placeholder="Internal code"
              value={businessCode}
              onChange={(e) => setBusinessCode(e.target.value)}
            />
          </div>
        </div>

        <h5 className="fw-bold mt-4 mb-2">Hours of Operation</h5>
        <div className="table-responsive">
          <table className="table table-sm align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{width: 160}}>Day</th>
                <th className="text-center">Open (HH:MM)</th>
                <th className="text-center">Close (HH:MM)</th>
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
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="number" className="form-control" placeholder="HH"
                        min={0} max={23} value={d.openHH}
                        onChange={(e) => onTimeChange(i, "openHH", e.target.value)}
                        disabled={!d.enabled}
                      />
                      <span>:</span>
                      <input
                        type="number" className="form-control" placeholder="MM"
                        min={0} max={59} value={d.openMM}
                        onChange={(e) => onTimeChange(i, "openMM", e.target.value)}
                        disabled={!d.enabled}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <input
                        type="number" className="form-control" placeholder="HH"
                        min={0} max={23} value={d.closeHH}
                        onChange={(e) => onTimeChange(i, "closeHH", e.target.value)}
                        disabled={!d.enabled}
                      />
                      <span>:</span>
                      <input
                        type="number" className="form-control" placeholder="MM"
                        min={0} max={59} value={d.closeMM}
                        onChange={(e) => onTimeChange(i, "closeMM", e.target.value)}
                        disabled={!d.enabled}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

        <div className="text-end mt-4">
          <button
            type="submit"
            className="btn btn-primary px-4"
            disabled={disabledSubmit || submitting}
          >
            {submitting ? (<><span className="spinner-border spinner-border-sm me-2" />Saving…</>) : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
