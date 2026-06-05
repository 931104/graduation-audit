import { useContext, useState } from "react";
import { StudentContext } from "./context/StudentContext";
import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Audit from "./pages/Audit";
import GPA from "./pages/GPA";

const NAV_ITEMS = [
  { id: "dashboard", icon: "◈", label: "總覽" },
  { id: "courses",   icon: "◉", label: "修課紀錄" },
  { id: "audit",     icon: "◎", label: "畢業審核" },
  { id: "gpa",       icon: "◈", label: "GPA 分析" },
];

export default function App() {
  const { studentId, setStudentId } = useContext(StudentContext);
  const [page, setPage] = useState("dashboard");

  if (!studentId) return <Upload />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Sidebar */}
      <aside style={{
        width: "240px",
        background: "linear-gradient(180deg, #1e1b4b 0%, #0f172a 100%)",
        display: "flex",
        flexDirection: "column",
        padding: "0",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
      }}>
        {/* Logo */}
        <div style={{
          padding: "28px 20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "6px",
          }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              flexShrink: 0,
            }}>🎓</div>
            <span style={{ color: "white", fontWeight: "700", fontSize: "15px" }}>
              Graduation Audit
            </span>
          </div>
          <p style={{ color: "#64748b", fontSize: "12px", marginLeft: "46px" }}>
            畢業學分檢核系統
          </p>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <p style={{
            color: "#475569",
            fontSize: "11px",
            fontWeight: "600",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "0 6px",
            marginBottom: "8px",
          }}>選單</p>

          {NAV_ITEMS.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`nav-btn ${page === id ? "active" : ""}`}
              onClick={() => setPage(id)}
            >
              <span style={{ fontSize: "16px", opacity: 0.85 }}>{icon}</span>
              {label}
              {page === id && (
                <span style={{
                  marginLeft: "auto",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#818cf8",
                  flexShrink: 0,
                }} />
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{
          padding: "16px 12px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}>
          <button
            className="nav-btn"
            style={{ color: "#f87171" }}
            onClick={() => { setStudentId(null); setPage("dashboard"); }}
          >
            <span style={{ fontSize: "16px" }}>↩</span>
            重新上傳 JSON
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: "32px", minWidth: 0, overflowX: "auto" }}>
        {page === "dashboard" && <Dashboard studentId={studentId} />}
        {page === "courses"   && <Courses   studentId={studentId} />}
        {page === "audit"     && <Audit     studentId={studentId} />}
        {page === "gpa"       && <GPA       studentId={studentId} />}
      </main>
    </div>
  );
}
