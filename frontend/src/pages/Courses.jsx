import { useEffect, useState } from "react";

const API = "http://localhost:8000";

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

  if (loading) return <div>載入中...</div>;

  const filtered = courses.filter((c) =>
    c.course_name.includes(keyword)
  );

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>📚 修課紀錄</h1>

      <input
        type="text"
        placeholder="搜尋課程..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{
          width: "300px",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "20px",
        }}
      />

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <thead style={{ background: "#0f172a", color: "white" }}>
          <tr>
            <th style={{ padding: "12px" }}>學年</th>
            <th style={{ padding: "12px" }}>學期</th>
            <th style={{ padding: "12px" }}>課程名稱</th>
            <th style={{ padding: "12px" }}>學分</th>
            <th style={{ padding: "12px" }}>成績</th>
            <th style={{ padding: "12px" }}>狀態</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((course, index) => (
            <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
              <td style={{ padding: "12px" }}>{course.academic_year}</td>
              <td style={{ padding: "12px" }}>{course.academic_semester}</td>
              <td style={{ padding: "12px" }}>{course.course_name}</td>
              <td style={{ padding: "12px" }}>{course.credit}</td>
              <td
                style={{
                  padding: "12px",
                  color:
                    course.score !== null
                      ? course.score >= 60
                        ? "#16a34a"
                        : "#dc2626"
                      : "#64748b",
                  fontWeight: "bold",
                }}
              >
                {course.score !== null ? course.score : "—"}
              </td>
              <td style={{ padding: "12px", color: "#64748b", fontSize: "13px" }}>
                {course.course_status === "有成績" ? "" : course.course_status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "15px", color: "#64748b" }}>
        共找到 {filtered.length} 門課程
      </div>
    </div>
  );
}
