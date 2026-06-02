import { useState, useEffect, useRef } from "react";

const KEY = "humanity-register-v1";
const PER = 50;

const SEX_LBL: Record<string, string> = { M: "Male", F: "Female", NB: "Non-Binary" };
const SEX_CLR: Record<string, { bg: string; fg: string }> = {
  M: { bg: "#dbeafe", fg: "#1d4ed8" },
  F: { bg: "#fce7f3", fg: "#be185d" },
  NB: { bg: "#f3f4f6", fg: "#374151" },
};

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  sex: string;
  nationality: string;
  birthDate: string;
  hometown: string;
  eyeColor: string;
  hairColor: string;
  fatherName: string;
  motherName: string;
  siblings: string;
  children: string;
  spouse: string;
  addedAt?: string;
}

const SEED: Person[] = [
  { id: "s1", firstName: "Maria", lastName: "Garcia", sex: "F", nationality: "Spanish", birthDate: "1990-03-14", hometown: "Madrid", eyeColor: "Brown", hairColor: "Dark Brown", fatherName: "Carlos Garcia", motherName: "Elena Garcia", siblings: "2", children: "1", spouse: "" },
  { id: "s2", firstName: "James", lastName: "Okafor", sex: "M", nationality: "Nigerian", birthDate: "1985-07-22", hometown: "Lagos", eyeColor: "Dark Brown", hairColor: "Black", fatherName: "Emmanuel Okafor", motherName: "Ngozi Okafor", siblings: "4", children: "2", spouse: "Adaeze Okafor" },
  { id: "s3", firstName: "Yuki", lastName: "Tanaka", sex: "F", nationality: "Japanese", birthDate: "1993-11-05", hometown: "Kyoto", eyeColor: "Dark Brown", hairColor: "Black", fatherName: "Hiroshi Tanaka", motherName: "Akiko Tanaka", siblings: "1", children: "0", spouse: "" },
  { id: "s4", firstName: "Mohammed", lastName: "Al-Rashid", sex: "M", nationality: "Saudi Arabian", birthDate: "1988-02-18", hometown: "Riyadh", eyeColor: "Brown", hairColor: "Black", fatherName: "Abdullah Al-Rashid", motherName: "Fatima Al-Rashid", siblings: "3", children: "3", spouse: "Layla Al-Rashid" },
  { id: "s5", firstName: "Alex", lastName: "Müller", sex: "NB", nationality: "German", birthDate: "1995-09-30", hometown: "Berlin", eyeColor: "Blue", hairColor: "Blonde", fatherName: "Klaus Müller", motherName: "Ingrid Müller", siblings: "1", children: "0", spouse: "" },
  { id: "s6", firstName: "Priya", lastName: "Sharma", sex: "F", nationality: "Indian", birthDate: "1988-12-01", hometown: "Mumbai", eyeColor: "Dark Brown", hairColor: "Black", fatherName: "Rajesh Sharma", motherName: "Sunita Sharma", siblings: "2", children: "1", spouse: "Vikram Patel" },
  { id: "s7", firstName: "Lucas", lastName: "Dubois", sex: "M", nationality: "French", birthDate: "1992-06-15", hometown: "Lyon", eyeColor: "Green", hairColor: "Brown", fatherName: "Pierre Dubois", motherName: "Sophie Dubois", siblings: "0", children: "0", spouse: "" },
  { id: "s8", firstName: "Amara", lastName: "Diallo", sex: "F", nationality: "Guinean", birthDate: "1997-04-08", hometown: "Conakry", eyeColor: "Dark Brown", hairColor: "Black", fatherName: "Mamadou Diallo", motherName: "Aissatou Diallo", siblings: "5", children: "0", spouse: "" },
  { id: "s9", firstName: "Wei", lastName: "Chen", sex: "M", nationality: "Chinese", birthDate: "1983-08-20", hometown: "Shanghai", eyeColor: "Dark Brown", hairColor: "Black", fatherName: "Jian Chen", motherName: "Mei Chen", siblings: "1", children: "2", spouse: "Li Chen" },
  { id: "s10", firstName: "Sofia", lastName: "Rossi", sex: "F", nationality: "Italian", birthDate: "2000-01-27", hometown: "Rome", eyeColor: "Hazel", hairColor: "Chestnut", fatherName: "Marco Rossi", motherName: "Giulia Rossi", siblings: "2", children: "0", spouse: "" },
];

const BLANK: Omit<Person, "id" | "addedAt"> = {
  firstName: "", lastName: "", sex: "", nationality: "", birthDate: "",
  hometown: "", eyeColor: "", hairColor: "", fatherName: "", motherName: "",
  siblings: "", children: "", spouse: "",
};

const fmtD = (d: string) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

const calcAge = (d: string): number | null =>
  d ? Math.floor((Date.now() - new Date(d + "T12:00:00").getTime()) / (365.25 * 86400000)) : null;

function FF({
  label, required, type = "text", value, onChange, error, placeholder, max,
}: {
  label: string; required?: boolean; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string; placeholder?: string; max?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
        {label}{required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder || ""} max={max}
        style={{
          width: "100%", padding: "8px 10px", border: `1px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          borderRadius: 6, fontSize: 13, outline: "none", boxSizing: "border-box",
          background: "#fff", color: "#0f172a",
        }}
      />
      {error && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 2, display: "block" }}>{error}</span>}
    </div>
  );
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Person) => Promise<void> }) {
  const [f, setF] = useState<Omit<Person, "id" | "addedAt">>(BLANK);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const u = (k: string, v: string) => setF(p => ({ ...p, [k]: v }));
  const ce = (k: string) => setErrs(p => ({ ...p, [k]: undefined as unknown as string }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!f.firstName.trim()) e.firstName = "Required";
    if (!f.lastName.trim()) e.lastName = "Required";
    if (!f.sex) e.sex = "Required";
    if (!f.nationality.trim()) e.nationality = "Required";
    if (!f.birthDate) e.birthDate = "Required";
    else {
      const a = calcAge(f.birthDate);
      if (a !== null && a < 18) e.birthDate = "Must be 18 or older";
      else if (a !== null && a > 120) e.birthDate = "Invalid date";
    }
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setBusy(true);
    await onAdd({ ...f, id: Date.now().toString(), addedAt: new Date().toISOString().split("T")[0] });
    setBusy(false);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17, color: "#0f172a" }}>Add to Register</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Adults 18+ only · Publicly visible</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#94a3b8", lineHeight: 1, padding: 2 }}>&#x2715;</button>
        </div>
        <div style={{ padding: "16px 22px" }}>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#92400e", marginBottom: 14 }}>
            &#9888;&#65039; Entries are publicly visible to all users. Submit only your own information, or with explicit consent.
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Required Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <FF label="First Name" required value={f.firstName} onChange={e => { u("firstName", e.target.value); ce("firstName"); }} error={errs.firstName} />
            <FF label="Last Name" required value={f.lastName} onChange={e => { u("lastName", e.target.value); ce("lastName"); }} error={errs.lastName} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
              Sex<span style={{ color: "#ef4444" }}>*</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["M", "F", "NB"] as const).map(s => (
                <button key={s} onClick={() => { u("sex", s); ce("sex"); }}
                  style={{
                    flex: 1, padding: "8px 0", border: f.sex === s ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: f.sex === s ? SEX_CLR[s].bg : "#fff",
                    color: f.sex === s ? SEX_CLR[s].fg : "#64748b",
                  }}>
                  {SEX_LBL[s]}
                </button>
              ))}
            </div>
            {errs.sex && <span style={{ color: "#ef4444", fontSize: 11, marginTop: 2, display: "block" }}>{errs.sex}</span>}
          </div>
          <FF label="Nationality" required value={f.nationality} onChange={e => { u("nationality", e.target.value); ce("nationality"); }} error={errs.nationality} />
          <FF label="Date of Birth" required type="date" value={f.birthDate} onChange={e => { u("birthDate", e.target.value); ce("birthDate"); }} error={errs.birthDate} max={new Date().toISOString().split("T")[0]} />
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", margin: "14px 0 8px" }}>Optional Details</div>
          <FF label="Hometown / Region" value={f.hometown} onChange={e => u("hometown", e.target.value)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <FF label="Eye Color" value={f.eyeColor} onChange={e => u("eyeColor", e.target.value)} />
            <FF label="Hair Color" value={f.hairColor} onChange={e => u("hairColor", e.target.value)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <FF label="Father's Name" value={f.fatherName} onChange={e => u("fatherName", e.target.value)} />
            <FF label="Mother's Name" value={f.motherName} onChange={e => u("motherName", e.target.value)} />
          </div>
          <FF label="Siblings" value={f.siblings} onChange={e => u("siblings", e.target.value)} placeholder="e.g. 2" />
          <FF label="Children" value={f.children} onChange={e => u("children", e.target.value)} placeholder="e.g. 0" />
          <FF label="Spouse / Partner" value={f.spouse} onChange={e => u("spouse", e.target.value)} />
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, cursor: "pointer", background: "#fff", color: "#475569" }}>
            Cancel
          </button>
          <button onClick={submit} disabled={busy}
            style={{ padding: "9px 24px", background: busy ? "#93c5fd" : "#2563eb", border: "none", borderRadius: 6, color: "#fff", fontWeight: 600, fontSize: 13, cursor: busy ? "default" : "pointer" }}>
            {busy ? "Saving…" : "Add to Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0 });
  const [q, setQ] = useState("");
  const [sexF, setSexF] = useState("ALL");
  const [natF, setNatF] = useState("ALL");
  const [sField, setSField] = useState("lastName");
  const [sAsc, setSAsc] = useState(true);
  const [pg, setPg] = useState(1);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [banner, setBanner] = useState(true);

  const closeT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchRef = useRef<{ x: number; y: number; timer: ReturnType<typeof setTimeout> } | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY);
      setData(stored ? JSON.parse(stored) : SEED);
      if (!stored) localStorage.setItem(KEY, JSON.stringify(SEED));
    } catch {
      setData(SEED);
    }
    setLoading(false);
  }, []);

  const save = (upd: Person[]) => {
    setData(upd);
    try { localStorage.setItem(KEY, JSON.stringify(upd)); } catch {}
  };

  const handleAdd = async (entry: Person) => {
    save([...data, entry]);
    setToast(`${entry.firstName} ${entry.lastName} added to the register!`);
    setTimeout(() => setToast(""), 4000);
  };

  const calcPos = (el: HTMLElement) => {
    const r = el.getBoundingClientRect(), W = 290, H = 360;
    let top = r.bottom + 6, left = r.left;
    if (top + H > window.innerHeight - 20) top = Math.max(8, r.top - H - 6);
    if (left + W > window.innerWidth - 16) left = Math.max(8, window.innerWidth - W - 16);
    if (left < 8) left = 8;
    return { top, left };
  };

  const startOpen = (pos: { top: number; left: number }, id: string) => {
    if (closeT.current) clearTimeout(closeT.current);
    if (openT.current) clearTimeout(openT.current);
    openT.current = setTimeout(() => { setDropPos(pos); setActiveId(id); }, 120);
  };
  const startClose = () => {
    if (openT.current) clearTimeout(openT.current);
    closeT.current = setTimeout(() => setActiveId(null), 200);
  };
  const cancelClose = () => { if (closeT.current) clearTimeout(closeT.current); };

  const onTS = (e: React.TouchEvent<HTMLSpanElement>, id: string) => {
    const t = e.touches[0], el = e.currentTarget;
    touchRef.current = {
      x: t.clientX, y: t.clientY,
      timer: setTimeout(() => {
        setDropPos(calcPos(el as HTMLElement)); setActiveId(id); touchRef.current = null;
      }, 600),
    };
  };
  const onTM = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - touchRef.current.x) > 8 || Math.abs(t.clientY - touchRef.current.y) > 8) {
      clearTimeout(touchRef.current.timer); touchRef.current = null;
    }
  };
  const onTE = () => {
    if (touchRef.current) { clearTimeout(touchRef.current.timer); touchRef.current = null; }
  };

  const nats = ["ALL", ...new Set(data.map(e => e.nationality).filter(Boolean).sort())];

  const filtered = data
    .filter(e => {
      if (sexF !== "ALL" && e.sex !== sexF) return false;
      if (natF !== "ALL" && e.nationality !== natF) return false;
      if (q) {
        const lq = q.toLowerCase();
        return `${e.firstName} ${e.lastName}`.toLowerCase().includes(lq)
          || (e.nationality || "").toLowerCase().includes(lq)
          || (e.hometown || "").toLowerCase().includes(lq);
      }
      return true;
    })
    .sort((a, b) => {
      const va = ((a as Record<string, string>)[sField] || "").toLowerCase();
      const vb = ((b as Record<string, string>)[sField] || "").toLowerCase();
      return sAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const rows = filtered.slice((pg - 1) * PER, pg * PER);
  const ae = data.find(e => e.id === activeId);

  const tglSort = (f: string) => {
    if (sField === f) setSAsc(a => !a); else { setSField(f); setSAsc(true); }
    setPg(1);
  };

  const Arr = ({ f }: { f: string }) => (
    <span style={{ marginLeft: 3, opacity: sField === f ? 1 : 0.2, fontSize: 10 }}>
      {sField === f && !sAsc ? "▼" : "▲"}
    </span>
  );

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#f8fafc", gap: 10, color: "#64748b", fontSize: 14 }}>
      <div style={{ width: 18, height: 18, border: "2px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      Loading registry…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                Humanity Register
              </h1>
              <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>A public registry of people from around the world</p>
            </div>
            <button onClick={() => setModal(true)}
              style={{ background: "#3b82f6", border: "none", color: "#fff", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
              + Add Yourself
            </button>
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 20, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
            <span>&#128101; <strong style={{ color: "#cbd5e1" }}>{data.length.toLocaleString()}</strong> registered</span>
            {filtered.length !== data.length && (
              <span>&#128269; <strong style={{ color: "#cbd5e1" }}>{filtered.length.toLocaleString()}</strong> matching</span>
            )}
          </div>
        </div>
      </div>

      {/* BANNER */}
      {banner && (
        <div style={{ background: "#eff6ff", borderBottom: "1px solid #bfdbfe", padding: "8px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, fontSize: 12, color: "#1e40af" }}>
            <span>&#128274; All entries are publicly visible. This is a voluntary registry. <strong>Never submit information without consent.</strong></span>
            <button onClick={() => setBanner(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#60a5fa", fontSize: 16, lineHeight: 1, padding: 2 }}>&#x2715;</button>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input value={q} onChange={e => { setQ(e.target.value); setPg(1); }} placeholder="Search names, nationalities, hometowns…"
            style={{ flex: 1, minWidth: 180, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, outline: "none", color: "#0f172a" }} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {(["ALL", "M", "F", "NB"] as const).map(s => (
              <button key={s} onClick={() => { setSexF(s); setPg(1); }}
                style={{
                  padding: "7px 11px", border: "1px solid #e2e8f0", borderRadius: 6,
                  background: sexF === s ? (s === "ALL" ? "#0f172a" : SEX_CLR[s]?.bg || "#f1f5f9") : "#fff",
                  color: sexF === s ? (s === "ALL" ? "#fff" : SEX_CLR[s]?.fg || "#374151") : "#64748b",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                {s === "ALL" ? "All" : SEX_LBL[s]}
              </button>
            ))}
          </div>
          <select value={natF} onChange={e => { setNatF(e.target.value); setPg(1); }}
            style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, outline: "none", color: "#475569", background: "#fff" }}>
            {nats.map(n => <option key={n} value={n}>{n === "ALL" ? "All Nationalities" : n}</option>)}
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ maxWidth: 960, margin: "20px auto 60px", padding: "0 24px" }}>
        <div style={{ overflowX: "auto", borderRadius: 10, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", border: "1px solid #e2e8f0" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {([
                  [null, "#", 44],
                  ["lastName", "Name", null],
                  ["sex", "Sex", 106],
                  ["nationality", "Nationality", null],
                  ["birthDate", "Born", 130],
                ] as [string | null, string, number | null][]).map(([field, lbl, w]) => (
                  <th key={lbl} onClick={field ? () => tglSort(field) : undefined}
                    style={{
                      padding: "10px 12px", textAlign: "left", color: "#94a3b8", fontWeight: 600,
                      fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em",
                      cursor: field ? "pointer" : "default", userSelect: "none",
                      width: w ? w : undefined, whiteSpace: "nowrap",
                    }}>
                    {lbl}{field && <Arr f={field} />}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8", fontSize: 13 }}>No results found</td></tr>
                : rows.map((e, i) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #f1f5f9", background: activeId === e.id ? "#f0f9ff" : "#fff", transition: "background 0.1s" }}>
                    <td style={{ padding: "10px 12px", color: "#d1d5db", fontSize: 11 }}>{(pg - 1) * PER + i + 1}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        onMouseEnter={ev => startOpen(calcPos(ev.currentTarget), e.id)}
                        onMouseLeave={startClose}
                        onTouchStart={ev => onTS(ev, e.id)}
                        onTouchMove={onTM}
                        onTouchEnd={onTE}
                        style={{ color: "#2563eb", cursor: "pointer", fontWeight: 600, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3 }}>
                        {e.lastName}, {e.firstName}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: SEX_CLR[e.sex]?.bg || "#f1f5f9", color: SEX_CLR[e.sex]?.fg || "#374151" }}>
                        {SEX_LBL[e.sex] || e.sex}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#475569" }}>{e.nationality}</td>
                    <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>
                      {fmtD(e.birthDate)}{e.birthDate && calcAge(e.birthDate) !== null ? ` (${calcAge(e.birthDate)})` : ""}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 16 }}>
            <button onClick={() => setPg(p => Math.max(1, p - 1))} disabled={pg === 1}
              style={{ padding: "6px 14px", border: "1px solid #e2e8f0", borderRadius: 6, background: pg === 1 ? "#f8fafc" : "#fff", color: pg === 1 ? "#cbd5e1" : "#475569", cursor: pg === 1 ? "default" : "pointer", fontSize: 13 }}>
              &#8592; Prev
            </button>
            <span style={{ color: "#94a3b8", padding: "0 8px", fontSize: 13 }}>Page {pg} of {pages}</span>
            <button onClick={() => setPg(p => Math.min(pages, p + 1))} disabled={pg === pages}
              style={{ padding: "6px 14px", border: "1px solid #e2e8f0", borderRadius: 6, background: pg === pages ? "#f8fafc" : "#fff", color: pg === pages ? "#cbd5e1" : "#475569", cursor: pg === pages ? "default" : "pointer", fontSize: 13 }}>
              Next &#8594;
            </button>
          </div>
        )}
        <p style={{ textAlign: "center", color: "#d1d5db", fontSize: 11, marginTop: 16 }}>
          Hover over a name to view details &middot; Tap &amp; hold on mobile
        </p>
      </div>

      {/* INFO CARD */}
      {activeId && ae && (
        <div onMouseEnter={cancelClose} onMouseLeave={startClose}
          style={{ position: "fixed", top: dropPos.top, left: dropPos.left, zIndex: 9999, width: 290 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.14)", padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{ae.firstName} {ae.lastName}</div>
                <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 1 }}>
                  {ae.addedAt ? `Added ${fmtD(ae.addedAt)}` : "Seed record"}
                </div>
              </div>
              <button onClick={() => { cancelClose(); setActiveId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 16, lineHeight: 1, padding: 2 }}>&#x2715;</button>
            </div>
            {([
              ["Born", fmtD(ae.birthDate) + (ae.birthDate && calcAge(ae.birthDate) !== null ? ` (age ${calcAge(ae.birthDate)})` : "")],
              ["Sex", SEX_LBL[ae.sex] || ae.sex],
              ["Nationality", ae.nationality],
              ae.hometown ? ["Hometown", ae.hometown] : null,
              ae.eyeColor ? ["Eye Color", ae.eyeColor] : null,
              ae.hairColor ? ["Hair Color", ae.hairColor] : null,
              ae.fatherName ? ["Father", ae.fatherName] : null,
              ae.motherName ? ["Mother", ae.motherName] : null,
              ae.siblings ? ["Siblings", ae.siblings] : null,
              ae.children ? ["Children", ae.children] : null,
              ae.spouse ? ["Spouse / Partner", ae.spouse] : null,
            ] as ([string, string] | null)[]).filter((x): x is [string, string] => Boolean(x) && Boolean(x![1])).map(([label, val]) => (
              <div key={label} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
                <span style={{ minWidth: 80, color: "#94a3b8", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", paddingTop: 1 }}>{label}</span>
                <span style={{ color: "#334155", fontSize: 12, wordBreak: "break-word" }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && <AddModal onClose={() => setModal(false)} onAdd={handleAdd} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#166534", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 20000, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
          &#10003; {toast}
        </div>
      )}
    </div>
  );
}
