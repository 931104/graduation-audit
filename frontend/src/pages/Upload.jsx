import { useState, useContext } from "react";
import { StudentContext } from "../context/StudentContext";

const API = "http://localhost:8000";

export default function Upload() {
  const { setStudentId } = useContext(StudentContext);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = async (e) => {
      let json;
      try {
        json = JSON.parse(e.target.result);
      } catch {
        alert("JSON 格式錯誤，請確認為全人系統匯出的檔案");
        return;
      }

      const about = json?.[0]?.["課業學習"]?.aboutMe;
      setPreview(about || null);

      setLoading(true);
      try {
        const res = await fetch(`${API}/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: json }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(`上傳失敗：${err.detail}`);
          return;
        }
        const { student_id } = await res.json();
        setStudentId(student_id);
      } catch {
        alert("無法連線到後端，請確認後端伺服器已啟動");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg,#e2e8f0,#f8fafc)",
      }}
    >
      <div
        style={{
          width: "650px",
          background: "white",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "10px" }}>🎓 Graduation Audit</h1>
        <h3 style={{ color: "#64748b", fontWeight: "normal", marginBottom: "30px" }}>
          畢業學分檢核系統
        </h3>
        <p style={{ color: "#64748b", marginBottom: "30px" }}>
          請上傳全人系統匯出的 JSON 檔案
        </p>

        <div
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          style={{
            border: dragging ? "3px solid #2563eb" : "3px dashed #94a3b8",
            borderRadius: "16px",
            padding: "60px",
            background: dragging ? "#eff6ff" : "#f8fafc",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ fontSize: "60px" }}>📂</div>
          <h2>拖曳 JSON 到這裡</h2>
          <p style={{ color: "#64748b" }}>或</p>
          <label
            style={{
              background: "#2563eb",
              color: "white",
              padding: "12px 24px",
              borderRadius: "10px",
              cursor: "pointer",
              display: "inline-block",
              marginTop: "10px",
            }}
          >
            選擇檔案
            <input
              type="file"
              accept=".json"
              hidden
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </label>
        </div>

        {fileName && (
          <div
            style={{
              marginTop: "20px",
              background: "#f8fafc",
              padding: "15px",
              borderRadius: "10px",
            }}
          >
            <strong>📄 已選擇：</strong>{fileName}
          </div>
        )}

        {loading && (
          <div style={{ marginTop: "20px", color: "#2563eb" }}>
            ⏳ 正在上傳並解析資料...
          </div>
        )}

        {preview && !loading && (
          <div
            style={{
              marginTop: "20px",
              background: "#dcfce7",
              padding: "20px",
              borderRadius: "12px",
              textAlign: "left",
            }}
          >
            <h3>✅ 成功讀取學生資料</h3>
            <p><strong>姓名：</strong>{preview.chineseName}</p>
            <p><strong>學號：</strong>{preview.studentNumber}</p>
            <p><strong>系所：</strong>{preview.registerMajor}</p>
            <p><strong>年級：</strong>{preview.departmentProgramGrade}</p>
          </div>
        )}

        <div style={{ marginTop: "25px", color: "#94a3b8", fontSize: "13px" }}>
          支援全人系統匯出的 JSON 格式
        </div>
      </div>
    </div>
  );
}
