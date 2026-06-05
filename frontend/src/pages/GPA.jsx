import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const API = "http://localhost:8000";

function InfoCard({ title, value }) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        minWidth: "220px",
        flex: 1,
      }}
    >
      <p style={{ color: "#64748b" }}>{title}</p>
      <h1>{value}</h1>
    </div>
  );
}

export default function GPA({ studentId }) {
  const [gpa, setGpa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/gpa/${studentId}`)
      .then((r) => r.json())
      .then(setGpa)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div>載入中...</div>;
  if (!gpa) return <div>載入失敗</div>;

  const chartData = gpa.semesters.map((sem) => ({
    semester: sem.label,
    gpa: parseFloat(sem.gpa.toFixed(2)),
    std_gpa: parseFloat(sem.std_gpa.toFixed(2)),
  }));

  return (
    <div>
      <h1>📈 GPA 分析</h1>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px", flexWrap: "wrap" }}>
        <InfoCard title="學校制 GPA" value={gpa.overall_gpa.toFixed(2)} />
        <InfoCard title="4.0 制 GPA" value={gpa.overall_std_gpa.toFixed(2)} />
        <InfoCard title="總計入學分" value={gpa.total_credits.toFixed(1)} />
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
          height: "400px",
        }}
      >
        <h2>歷年 GPA 趨勢（學校制 / 4.3）</h2>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="semester" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 4.3]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="gpa"
              name="學校制 GPA"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="std_gpa"
              name="4.0 制 GPA"
              stroke="#16a34a"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 各學期明細 */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
        }}
      >
        <h2>各學期明細</h2>
        {gpa.semesters.map((sem, i) => (
          <details key={i} style={{ marginBottom: "10px" }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold", padding: "8px 0" }}>
              {sem.label}｜GPA {sem.gpa.toFixed(2)}（4.0制：{sem.std_gpa.toFixed(2)}）｜{sem.total_credits.toFixed(1)} 學分
            </summary>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px" }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ padding: "8px", textAlign: "left" }}>課程</th>
                  <th style={{ padding: "8px" }}>學分</th>
                  <th style={{ padding: "8px" }}>成績</th>
                  <th style={{ padding: "8px" }}>GPA</th>
                </tr>
              </thead>
              <tbody>
                {sem.courses.map((c, j) => (
                  <tr key={j} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: "8px" }}>{c.course_name}</td>
                    <td style={{ padding: "8px", textAlign: "center" }}>{c.credit}</td>
                    <td style={{ padding: "8px", textAlign: "center", color: c.score >= 60 ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>
                      {c.score}
                    </td>
                    <td style={{ padding: "8px", textAlign: "center" }}>{c.school_gpa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </div>
    </div>
  );
}
