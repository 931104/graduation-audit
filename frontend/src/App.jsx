import { useContext, useState } from "react";

import { StudentContext } from "./context/StudentContext";

import Upload from "./pages/Upload";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Audit from "./pages/Audit";
import GPA from "./pages/GPA";

export default function App() {
  const {
    studentData,
    setStudentData,
  } = useContext(StudentContext);

  const [page, setPage] =
    useState("dashboard");

  if (!studentData) {
    return <Upload />;
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          background: "#0f172a",
          color: "white",
          padding: "20px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <h2>
            🎓 Graduation Audit
          </h2>

          <p
            style={{
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            畢業學分檢核系統
          </p>
        </div>

        <hr />

        <button
          style={buttonStyle}
          onClick={() =>
            setPage("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          style={buttonStyle}
          onClick={() =>
            setPage("courses")
          }
        >
          📚 修課紀錄
        </button>

        <button
          style={buttonStyle}
          onClick={() =>
            setPage("audit")
          }
        >
          🎓 畢業審核
        </button>

        <button
          style={buttonStyle}
          onClick={() =>
            setPage("gpa")
          }
        >
          📈 GPA 分析
        </button>

        <hr />

        <button
          style={{
            ...buttonStyle,
            background: "#dc2626",
          }}
          onClick={() => {
            setStudentData(null);
            setPage("dashboard");
          }}
        >
          🔄 重新上傳 JSON
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: "30px",
        }}
      >
        {page === "dashboard" && (
          <Dashboard />
        )}

        {page === "courses" && (
          <Courses />
        )}

        {page === "audit" && (
          <Audit />
        )}

        {page === "gpa" && (
          <GPA />
        )}
      </div>
    </div>
  );
}

const buttonStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  background: "#1e293b",
  color: "white",
  fontSize: "15px",
};