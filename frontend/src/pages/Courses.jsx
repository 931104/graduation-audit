import { useEffect, useState } from "react";

const API = "http://localhost:8000";

const STATUS_COLORS = {
  "有成績": { bg: "#f0fdf4", color: "#16a34a", label: "通過" },
  "缺修": { bg: "#fee2e2", color: "#dc2626", label: "缺修" },
};

export default function Courses({ studentId }) {
  const [courses, setCourses] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/courses/${studentId}`)
      .then((r) => r.json())
      .then(setCourses)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      載入中...
    </div>
  );

  const filtered = courses.filter((c) =>
    c.course_name.includes(keyword)
  );

  return (
    <div style={{ maxWidth: "1100px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", color: "#1e293b", marginBottom: "4px" }}>修課紀錄</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>
          共 {courses.length} 門課程，顯示 {filtered.length} 筆結果
        </p>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <span style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
            fontSize: "15px",
            pointerEvents: "none",
          }}>🔍</span>
          <input
            type="text"
            placeholder="搜尋課程名稱..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{
              paddingLeft: "36px",
              paddingRight: "16px",
              paddingTop: "10px",
              paddingBottom: "10px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
              fontSize: "14px",
              width: "280px",
              background: "white",
              color: "#1e293b",
              outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr className="table-header">
              <th>學年</th>
              <th>學期</th>
              <th style={{ minWidth: "200px" }}>課程名稱</th>
              <th style={{ textAlign: "center" }}>學分</th>
              <th style={{ textAlign: "center" }}>成績</th>
              <th style={{ textAlign: "center" }}>狀態</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  padding: "48px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "14px",
                }}>
                  找不到相符的課程
                </td>
              </tr>
            ) : (
              filtered.map((course, i) => {
                const st = STATUS_COLORS[course.course_status];
                return (
                  <tr key={i} className="table-row">
                    <td style={{ color: "#64748b", fontWeight: "500" }}>
                      {course.academic_year}
                    </td>
                    <td style={{ color: "#64748b" }}>{course.academic_semester}</td>
                    <td style={{ fontWeight: "500", color: "#1e293b" }}>
                      {course.course_name}
                    </td>
                    <td style={{ textAlign: "center", color: "#475569" }}>
                      {course.credit}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {course.score !== null ? (
                        <span className={course.score >= 60 ? "score-pass" : "score-fail"}>
                          {course.score}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {course.course_status !== "有成績" && course.course_status ? (
                        <span style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "9999px",
                          fontSize: "12px",
                          fontWeight: "600",
                          background: st?.bg || "#f1f5f9",
                          color: st?.color || "#64748b",
                        }}>
                          {st?.label || course.course_status}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "13px" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
