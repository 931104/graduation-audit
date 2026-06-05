import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

const API = "http://localhost:8000";

function InfoCard({ title, value, sub, accent }) {
  return (
    <div className="card" style={{
      flex: 1,
      minWidth: "160px",
      padding: "20px 24px",
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

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "10px",
      padding: "12px 16px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    }}>
      <p style={{ fontWeight: "700", color: "#374151", marginBottom: "6px" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: "13px" }}>
          {p.name}：<strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function GPA({ studentId }) {
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSem, setOpenSem] = useState(null);

  useEffect(() => {
    fetch(`${API}/gpa/${studentId}`)
      .then((r) => r.json())
      .then(setGpa)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      載入中...
    </div>
  );
  if (!gpa) return <div className="loading-screen">載入失敗</div>;

  const chartData = gpa.semesters.map((sem) => ({
    semester: sem.label,
    "學校制": parseFloat(sem.gpa.toFixed(2)),
    "4.0 制": parseFloat(sem.std_gpa.toFixed(2)),
  }));

  return (
    <div style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", color: "#1e293b", marginBottom: "4px" }}>GPA 分析</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>歷年 GPA 趨勢與各學期明細</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <InfoCard title="學校制 GPA" value={gpa.overall_gpa.toFixed(2)}     accent="#6366f1" sub="整體平均" />
        <InfoCard title="4.0 制 GPA" value={gpa.overall_std_gpa.toFixed(2)} accent="#22c55e" sub="標準制" />
        <InfoCard title="計入學分數" value={gpa.total_credits.toFixed(1)}   accent="#f59e0b" sub="總學分" />
      </div>

      {/* Chart */}
      <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", marginBottom: "20px" }}>
          歷年 GPA 趨勢
        </h3>
        <div style={{ height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="semester"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 4.3]}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "13px", paddingTop: "16px" }}
              />
              <ReferenceLine y={2.0} stroke="#fca5a5" strokeDasharray="4 4" label={{ value: "最低標準 2.0", position: "right", fontSize: 11, fill: "#f87171" }} />
              <Line
                type="monotone"
                dataKey="學校制"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="4.0 制"
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Semester details */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>各學期明細</h3>
        </div>
        {gpa.semesters.map((sem, i) => {
          const isOpen = openSem === i;
          const gpaColor = sem.gpa >= 3 ? "#16a34a" : sem.gpa >= 2 ? "#f59e0b" : "#dc2626";
          return (
            <div key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <button
                onClick={() => setOpenSem(isOpen ? null : i)}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  background: isOpen ? "#fafafa" : "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>
                    {sem.label}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "13px", marginLeft: "12px" }}>
                    {sem.total_credits.toFixed(1)} 學分
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    background: "#eef2ff",
                    color: "#6366f1",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}>
                    {sem.gpa.toFixed(2)}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                    4.0: {sem.std_gpa.toFixed(2)}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "12px", marginLeft: "4px" }}>
                    {isOpen ? "▲" : "▼"}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: "0 24px 16px", background: "#fafafa" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", background: "#f1f5f9", borderRadius: "6px" }}>
                          課程名稱
                        </th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", background: "#f1f5f9" }}>
                          學分
                        </th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", background: "#f1f5f9" }}>
                          成績
                        </th>
                        <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", background: "#f1f5f9" }}>
                          GPA
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.courses.map((c, j) => (
                        <tr key={j} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "10px 12px", fontSize: "13px", color: "#374151", fontWeight: "500" }}>
                            {c.course_name}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
                            {c.credit}
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center" }}>
                            <span className={c.score >= 60 ? "score-pass" : "score-fail"}>
                              {c.score}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "13px", color: "#475569", fontWeight: "600" }}>
                            {c.school_gpa}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
