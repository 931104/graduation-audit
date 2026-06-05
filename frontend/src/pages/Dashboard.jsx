import { useEffect, useState } from "react";
import CreditPieChart from "../components/CreditPieChart";

const API = "http://localhost:8000";

function StatCard({ title, value, sub, accent }) {
  return (
    <div className="card" style={{
      padding: "20px 24px",
      flex: 1,
      minWidth: "160px",
      borderTop: `3px solid ${accent || "#6366f1"}`,
    }}>
      <p style={{ color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
        {title}
      </p>
      <p style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

export default function Dashboard({ studentId }) {
  const [student, setStudent] = useState(null);
  const [audit, setAudit] = useState(null);
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/student/${studentId}`).then((r) => r.json()),
      fetch(`${API}/audit/${studentId}`).then((r) => r.json()),
      fetch(`${API}/gpa/${studentId}`).then((r) => r.json()),
    ])
      .then(([s, a, g]) => { setStudent(s); setAudit(a); setGpa(g); })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      載入中...
    </div>
  );
  if (!student || !audit || !gpa) return <div className="loading-screen">載入失敗</div>;

  const earned = audit.summary.total_earned;
  const required = audit.summary.total_required;
  const remain = required - earned;
  const progress = Math.min((earned / required) * 100, 100);

  const latestSemester = gpa.semesters[gpa.semesters.length - 1];
  const latestCourses = latestSemester?.courses?.slice(0, 5) || [];

  const alerts = [
    !audit.required.is_passed && `專業必修尚缺 ${audit.required.missing.length} 門課程`,
    !audit.group.is_passed   && "群修學分尚未達標",
    !audit.general.is_passed && "通識學分尚未達標",
    !audit.physical.is_passed && `體育尚缺 ${audit.physical.shortage.toFixed(1)} 學分`,
    !audit.elective.is_passed && `選修尚缺 ${(audit.elective.required_credits - audit.elective.total_credits).toFixed(1)} 學分`,
  ].filter(Boolean);

  const graduated = audit.summary.is_graduated;

  return (
    <div style={{ maxWidth: "1200px" }}>
      {/* Page header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", color: "#1e293b", marginBottom: "4px" }}>總覽</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>查看你的畢業進度與學分狀態</p>
      </div>

      {/* Graduation status banner */}
      <div className="card" style={{
        padding: "20px 24px",
        marginBottom: "24px",
        background: graduated
          ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
          : "linear-gradient(135deg, #fff7ed, #fee2e2)",
        border: `1px solid ${graduated ? "#bbf7d0" : "#fecaca"}`,
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}>
        <span style={{ fontSize: "28px" }}>{graduated ? "✅" : "⏳"}</span>
        <div>
          <p style={{
            fontWeight: "700",
            fontSize: "16px",
            color: graduated ? "#15803d" : "#92400e",
          }}>
            {graduated ? "恭喜！你已符合畢業資格" : "尚未符合畢業資格"}
          </p>
          <p style={{ fontSize: "13px", color: graduated ? "#166534" : "#78350f", marginTop: "2px" }}>
            {graduated
              ? "所有畢業條件均已達標"
              : `還有 ${alerts.length} 項條件未達標，繼續加油！`}
          </p>
        </div>
      </div>

      {/* Top row: student info + pie chart */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap" }}>
        {/* Student info */}
        <div className="card" style={{ flex: 1, minWidth: "260px", padding: "24px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "20px",
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              flexShrink: 0,
            }}>👤</div>
            <div>
              <h2 style={{ fontSize: "20px", color: "#1e293b" }}>{student.chinese_name}</h2>
              <p style={{ color: "#64748b", fontSize: "13px" }}>{student.student_id}</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {[
              ["系所", student.department],
              ["入學年", student.enrollment_year],
            ].map(([label, val]) => (
              <div key={label} style={{
                padding: "12px",
                borderRadius: "10px",
                background: "#f8fafc",
                border: "1px solid #f1f5f9",
              }}>
                <p style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>{label}</p>
                <p style={{ color: "#1e293b", fontSize: "14px", fontWeight: "600" }}>{val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pie chart */}
        <div className="card" style={{ padding: "24px", flexShrink: 0 }}>
          <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#374151", marginBottom: "4px" }}>
            學分完成比例
          </h3>
          <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "8px" }}>
            已完成 {earned.toFixed(1)} / {required} 學分
          </p>
          <CreditPieChart earned={earned} remain={remain} />
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "20px" }}>
        <StatCard title="已修學分"  value={earned.toFixed(1)}              accent="#6366f1" />
        <StatCard title="剩餘學分"  value={remain.toFixed(1)}              accent="#f43f5e" />
        <StatCard title="完成率"    value={`${progress.toFixed(1)}%`}      accent="#22c55e" />
        <StatCard title="學校 GPA"  value={gpa.overall_gpa.toFixed(2)}     accent="#f59e0b" />
        <StatCard title="4.0 GPA"   value={gpa.overall_std_gpa.toFixed(2)} accent="#06b6d4" />
      </div>

      {/* Progress bar */}
      <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            畢業進度
          </h3>
          <span style={{ fontWeight: "700", fontSize: "20px", color: "#6366f1" }}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>已修 {earned.toFixed(1)} 學分</span>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>尚缺 {remain.toFixed(1)} 學分</span>
        </div>
      </div>

      {/* Recent courses + alerts */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {/* Recent courses */}
        <div className="card" style={{ flex: 2, minWidth: "300px", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              最近修課紀錄
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
              {latestSemester?.label}
            </p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr className="table-header">
                <th>課程名稱</th>
                <th style={{ textAlign: "center" }}>學分</th>
                <th style={{ textAlign: "center" }}>成績</th>
              </tr>
            </thead>
            <tbody>
              {latestCourses.map((c, i) => (
                <tr key={i} className="table-row">
                  <td style={{ fontWeight: "500" }}>{c.course_name}</td>
                  <td style={{ textAlign: "center", color: "#64748b" }}>{c.credit}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={c.score >= 60 ? "score-pass" : "score-fail"}>
                      {c.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Alerts */}
        <div className="card" style={{ flex: 1, minWidth: "240px", padding: "24px" }}>
          <h3 className="section-title">畢業提醒</h3>
          {alerts.length === 0 ? (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 16px",
              textAlign: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "36px" }}>🎉</span>
              <p style={{ color: "#16a34a", fontWeight: "600", fontSize: "14px" }}>
                所有條件均已達標
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {alerts.map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: "10px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  fontSize: "13px",
                  color: "#92400e",
                }}>
                  <span style={{ flexShrink: 0 }}>⚠</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
