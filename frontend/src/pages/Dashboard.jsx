import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import CreditPieChart from "../components/CreditPieChart";

const API = "http://localhost:8000";

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
      .then(([s, a, g]) => {
        setStudent(s);
        setAudit(a);
        setGpa(g);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div>載入中...</div>;
  if (!student || !audit || !gpa) return <div>載入失敗</div>;

  const earnedCredits = audit.summary.total_earned;
  const requiredCredits = audit.summary.total_required;
  const remainCredits = requiredCredits - earnedCredits;
  const progress = ((earnedCredits / requiredCredits) * 100).toFixed(1);

  const latestSemester = gpa.semesters[gpa.semesters.length - 1];
  const latestCourses = latestSemester?.courses?.slice(0, 5) || [];

  const alerts = [
    !audit.required.is_passed && `專業必修尚缺 ${audit.required.missing.length} 門`,
    !audit.group.is_passed && "群修未達標",
    !audit.general.is_passed && "通識未達標",
    !audit.physical.is_passed && `體育尚缺 ${audit.physical.shortage.toFixed(1)} 學分`,
    !audit.elective.is_passed && `選修尚缺 ${(audit.elective.required_credits - audit.elective.total_credits).toFixed(1)} 學分`,
  ].filter(Boolean);

  return (
    <div>

    <div
      style={{
        background: "#2563eb",
        color: "white",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
      }}
    >
      <h2>
        🚀 網站開發測試成功
      </h2>

      <p>
        如果看到這段文字，
        代表你修改成功並重新部署了。
      </p>
    </div>

    {/* 上方區塊 */}
    <div
      style={{
        display: "flex",
        gap: "20px",
        alignItems: "stretch",
      }}
    ></div>
      {/* 上方區塊 */}
      <div style={{ display: "flex", gap: "20px", alignItems: "stretch" }}>
        {/* 學生資訊 */}
        <div
          style={{
            flex: 1,
            background: "white",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h1>{student.chinese_name}</h1>
          <p>學號：{student.student_id}</p>
          <p>系所：{student.department}</p>
          <p>入學年：{student.enrollment_year}</p>
        </div>

        {/* 圓餅圖 */}
        <div
          style={{
            width: "420px",
            background: "white",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2>學分完成比例</h2>
          <CreditPieChart earned={earnedCredits} remain={remainCredits} />
        </div>
      </div>

      {/* 統計卡 */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "20px" }}>
        <StatCard title="已修學分" value={earnedCredits.toFixed(1)} />
        <StatCard title="剩餘學分" value={remainCredits.toFixed(1)} />
        <StatCard title="完成率" value={`${progress}%`} />
        <StatCard title="學校 GPA" value={gpa.overall_gpa.toFixed(2)} />
        <StatCard title="4.0 GPA" value={gpa.overall_std_gpa.toFixed(2)} />
      </div>

      {/* 畢業進度 */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
        }}
      >
        <h2>畢業進度</h2>
        <p>已完成：{earnedCredits.toFixed(1)} 學分</p>
        <p>尚缺：{remainCredits.toFixed(1)} 學分</p>
        <div
          style={{
            width: "100%",
            height: "30px",
            background: "#ddd",
            borderRadius: "20px",
          }}
        >
          <div
            style={{
              width: `${Math.min(progress, 100)}%`,
              height: "100%",
              background: "#22c55e",
              borderRadius: "20px",
            }}
          />
        </div>
      </div>

      {/* 最近修課紀錄 */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
        }}
      >
        <h2>最近修課紀錄（{latestSemester?.label}）</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: "10px" }}>課程</th>
              <th style={{ padding: "10px" }}>學分</th>
              <th style={{ padding: "10px" }}>成績</th>
            </tr>
          </thead>
          <tbody>
            {latestCourses.map((course, index) => (
              <tr key={index}>
                <td style={{ padding: "10px" }}>{course.course_name}</td>
                <td style={{ padding: "10px" }}>{course.credit}</td>
                <td
                  style={{
                    padding: "10px",
                    color: course.score >= 60 ? "green" : "red",
                    fontWeight: "bold",
                  }}
                >
                  {course.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 畢業提醒 */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
        }}
      >
        <h2>⚠ 畢業提醒</h2>
        {alerts.length === 0 ? (
          <p style={{ color: "green" }}>✅ 所有條件均已達標</p>
        ) : (
          alerts.map((item, index) => (
            <div
              key={index}
              style={{
                background: "#fef3c7",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            >
              {item}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
