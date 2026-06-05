import { useEffect, useState } from "react";

const API = "http://localhost:8000";

function RequirementRow({ label, passed, earned, required, detail }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "14px 0",
      borderBottom: "1px solid #f1f5f9",
    }}>
      <span style={{ fontSize: "18px", flexShrink: 0 }}>
        {passed ? "✅" : "❌"}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>{label}</span>
          <span style={{ fontSize: "13px", color: "#64748b" }}>
            {earned} / {required} 學分
          </span>
        </div>
        {detail && (
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "3px" }}>{detail}</p>
        )}
      </div>
    </div>
  );
}

function SectionCard({ icon, title, passed, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="card" style={{ overflow: "hidden", marginBottom: "16px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "none",
          border: "none",
          cursor: "pointer",
          borderBottom: open ? "1px solid #f1f5f9" : "none",
        }}
      >
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span style={{ flex: 1, fontWeight: "700", fontSize: "15px", color: "#1e293b", textAlign: "left" }}>
          {title}
        </span>
        <span className={passed ? "badge-pass" : "badge-fail"}>
          {passed ? "✓ 達標" : "✗ 未達標"}
        </span>
        <span style={{ color: "#94a3b8", marginLeft: "8px", fontSize: "13px" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && (
        <div style={{ padding: "4px 24px 16px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function MissingTag({ name }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "4px 10px",
      borderRadius: "6px",
      background: "#fee2e2",
      color: "#dc2626",
      fontSize: "12px",
      fontWeight: "500",
      margin: "3px",
    }}>{name}</span>
  );
}

function GroupBar({ label, credit, target }) {
  const pct = Math.min((credit / target) * 100, 100);
  const ok = credit >= target;
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{label}</span>
        <span style={{ fontSize: "12px", color: ok ? "#16a34a" : "#64748b" }}>
          {credit.toFixed(1)} / {target} 學分 {ok ? "✓" : ""}
        </span>
      </div>
      <div className="progress-bar" style={{ height: "6px" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: "9999px",
          background: ok ? "#22c55e" : "#6366f1",
          transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

export default function Audit({ studentId }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/audit/${studentId}`)
      .then((r) => r.json())
      .then(setAudit)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      載入中...
    </div>
  );
  if (!audit) return <div className="loading-screen">載入失敗</div>;

  const { summary, required, group, general, physical, elective } = audit;
  const remain = summary.total_required - summary.total_earned;

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", color: "#1e293b", marginBottom: "4px" }}>畢業審核</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>檢視各項畢業條件達標狀況</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <div className="card" style={{
          flex: 1, minWidth: "180px", padding: "20px 24px", borderTop: "3px solid #6366f1",
        }}>
          <p style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            已修總學分
          </p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b" }}>
            {summary.total_earned.toFixed(1)}
            <span style={{ fontSize: "16px", color: "#94a3b8", fontWeight: "400" }}>{" "}/ {summary.total_required}</span>
          </p>
        </div>
        <div className="card" style={{
          flex: 1, minWidth: "180px", padding: "20px 24px",
          borderTop: `3px solid ${remain <= 0 ? "#22c55e" : "#f43f5e"}`,
        }}>
          <p style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            剩餘學分
          </p>
          <p style={{ fontSize: "28px", fontWeight: "800", color: remain <= 0 ? "#16a34a" : "#dc2626" }}>
            {remain <= 0 ? "0.0" : remain.toFixed(1)}
          </p>
        </div>
        <div className="card" style={{
          flex: 1, minWidth: "180px", padding: "20px 24px",
          background: summary.is_graduated ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "linear-gradient(135deg, #fff7ed, #fee2e2)",
          border: `1px solid ${summary.is_graduated ? "#bbf7d0" : "#fecaca"}`,
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <span style={{ fontSize: "32px" }}>{summary.is_graduated ? "🎓" : "📋"}</span>
          <div>
            <p style={{ fontSize: "12px", fontWeight: "600", color: summary.is_graduated ? "#15803d" : "#92400e", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              畢業資格
            </p>
            <p style={{ fontWeight: "700", fontSize: "15px", color: summary.is_graduated ? "#15803d" : "#dc2626" }}>
              {summary.is_graduated ? "符合資格" : "尚未符合"}
            </p>
          </div>
        </div>
      </div>

      {/* 主要內容：兩欄 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", alignItems: "start" }}>

        {/* 左欄：必修 + 群修 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <SectionCard icon="📌" title="專業必修" passed={required.is_passed}>
            <RequirementRow
              label="專業必修學分"
              passed={required.is_passed}
              earned={required.credits.toFixed(1)}
              required={required.required_credits}
            />
            {required.missing.length > 0 && (
              <div style={{ marginTop: "10px" }}>
                <p style={{ fontSize: "12px", fontWeight: "600", color: "#dc2626", marginBottom: "6px" }}>尚缺課程：</p>
                <div>{required.missing.map((name, i) => <MissingTag key={i} name={name} />)}</div>
              </div>
            )}
          </SectionCard>

          <SectionCard icon="📚" title="專業群修" passed={group.is_passed}>
            <div style={{ paddingTop: "12px" }}>
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                <div style={{ padding: "10px 16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>總計入學分：</span>
                  <strong style={{ color: "#1e293b" }}>{group.used_credits.toFixed(1)} / {group.required_credits}</strong>
                </div>
                <div style={{ padding: "10px 16px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "13px" }}>
                  <span style={{ color: "#64748b" }}>BCDE 達標群數：</span>
                  <strong style={{ color: group.domain_ok ? "#16a34a" : "#dc2626" }}>
                    {group.domain_count} / 3 {group.domain_ok ? "✓" : ""}
                  </strong>
                </div>
              </div>
              <GroupBar label="群A（需 6 學分）" credit={group.group_credits["群A"] || 0} target={6} />
              {Object.entries(group.group_credits)
                .filter(([name]) => name !== "群A")
                .map(([name, credit]) => (
                  <GroupBar key={name} label={name} credit={credit} target={3} />
                ))}
            </div>
          </SectionCard>
        </div>

        {/* 右欄：通識 */}
        <div>
          <SectionCard icon="🌐" title="通識教育" passed={general.is_passed}>
            <div style={{ paddingTop: "12px" }}>
              {Object.entries(general.display)
                .filter(([key]) => key !== "核通" && key !== "缺額")
                .map(([key, val]) => (
                  <RequirementRow
                    key={key}
                    label={key}
                    passed={true}
                    earned={typeof val === "number" ? val.toFixed(1) : val}
                    required="—"
                  />
                ))}
              <div style={{
                padding: "12px 14px", borderRadius: "8px",
                background: general.display["核通"]?.completed_count >= general.display["核通"]?.required_domains ? "#f0fdf4" : "#fff7ed",
                border: "1px solid #e2e8f0", marginTop: "8px",
              }}>
                <p style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
                  核心通識：{general.display["核通"]?.completed_count} / {general.display["核通"]?.required_domains} 領域
                </p>
                <p style={{ fontSize: "12px", color: "#64748b" }}>
                  {general.display["核通"]?.completed_domains?.join("、") || "尚無已達標領域"}
                </p>
              </div>
              {Object.entries(general.display["缺額"] || {}).some(([, v]) => v > 0) && (
                <div style={{ marginTop: "12px" }}>
                  <p style={{ fontSize: "12px", fontWeight: "600", color: "#dc2626", marginBottom: "6px" }}>尚缺：</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {Object.entries(general.display["缺額"])
                      .filter(([, v]) => v > 0)
                      .map(([label, val]) => (
                        <span key={label} style={{
                          padding: "4px 10px", borderRadius: "6px",
                          background: "#fee2e2", color: "#dc2626",
                          fontSize: "12px", fontWeight: "500",
                        }}>
                          {label}：{val.toFixed(1)} 學分
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* 下方：體育 + 選修 並排 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <SectionCard icon="🏃" title="體育" passed={physical.is_passed}>
          <RequirementRow
            label="體育學分"
            passed={physical.is_passed}
            earned={physical.used_credits.toFixed(1)}
            required={physical.required_credits}
            detail={physical.shortage > 0 ? `尚缺 ${physical.shortage.toFixed(1)} 學分` : undefined}
          />
        </SectionCard>

        <SectionCard icon="🔖" title="自由選修" passed={elective.is_passed}>
          <RequirementRow
            label="選修學分"
            passed={elective.is_passed}
            earned={elective.total_credits.toFixed(1)}
            required={elective.required_credits.toFixed(1)}
            detail={!elective.is_passed
              ? `尚缺 ${(elective.required_credits - elective.total_credits).toFixed(1)} 學分`
              : undefined}
          />
        </SectionCard>
      </div>
    </div>
  );
}
