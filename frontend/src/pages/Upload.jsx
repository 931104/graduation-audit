import { useState, useContext } from "react";
import { StudentContext } from "../context/StudentContext";

const API = "http://localhost:8000";

export default function Upload() {
  const { setStudentId } = useContext(StudentContext);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setError("");
    setPreview(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      let json;
      try {
        json = JSON.parse(e.target.result);
      } catch {
        setError("JSON 格式錯誤，請確認為全人系統匯出的檔案");
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
          setError(`上傳失敗：${err.detail}`);
          return;
        }
        const { student_id } = await res.json();
        setStudentId(student_id);
      } catch {
        setError("無法連線到後端，請確認後端伺服器已啟動");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #eef2ff 0%, #f1f5f9 50%, #f0fdf4 100%)",
      padding: "24px",
    }}>
      <div style={{ width: "100%", maxWidth: "560px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "20px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
            margin: "0 auto 16px",
            boxShadow: "0 8px 24px rgba(99,102,241,0.3)",
          }}>🎓</div>
          <h1 style={{ fontSize: "26px", color: "#1e293b", marginBottom: "6px" }}>
            Graduation Audit
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px" }}>
            畢業學分檢核系統
          </p>
        </div>

        {/* Upload card */}
        <div className="card" style={{ padding: "32px" }}>
          <p style={{ color: "#475569", fontSize: "14px", marginBottom: "20px", textAlign: "center" }}>
            請上傳全人系統匯出的 JSON 檔案以開始分析
          </p>

          {/* Drop zone */}
          <div
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            style={{
              border: dragging ? "2px solid #6366f1" : "2px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "48px 24px",
              textAlign: "center",
              background: dragging ? "#eef2ff" : "#f8fafc",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>
              {dragging ? "📂" : "📄"}
            </div>
            <p style={{ fontWeight: "600", color: "#374151", marginBottom: "4px" }}>
              拖曳 JSON 到這裡
            </p>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px" }}>或</p>
            <label style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white",
              fontWeight: "600",
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
              transition: "opacity 0.15s",
            }}>
              選擇檔案
              <input
                type="file"
                accept=".json"
                hidden
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </label>
          </div>

          {/* File selected */}
          {fileName && !error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "16px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}>
              <span style={{ fontSize: "20px" }}>📄</span>
              <span style={{ fontSize: "13px", color: "#475569", fontWeight: "500" }}>
                {fileName}
              </span>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginTop: "16px",
              padding: "14px",
              borderRadius: "10px",
              background: "#eef2ff",
            }}>
              <div className="spinner" />
              <span style={{ color: "#6366f1", fontSize: "14px", fontWeight: "500" }}>
                正在上傳並解析資料...
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: "16px",
              padding: "14px 16px",
              borderRadius: "10px",
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: "14px",
            }}>
              ⚠ {error}
            </div>
          )}

          {/* Preview */}
          {preview && !loading && (
            <div style={{
              marginTop: "16px",
              padding: "20px",
              borderRadius: "12px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}>
                <span style={{ fontSize: "18px" }}>✅</span>
                <span style={{ fontWeight: "700", color: "#15803d", fontSize: "15px" }}>
                  成功讀取學生資料
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  ["姓名", preview.chineseName],
                  ["學號", preview.studentNumber],
                  ["系所", preview.registerMajor],
                  ["年級", preview.departmentProgramGrade],
                ].map(([label, val]) => (
                  <div key={label} style={{
                    background: "white",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #d1fae5",
                  }}>
                    <p style={{ color: "#64748b", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>
                      {label}
                    </p>
                    <p style={{ color: "#1e293b", fontSize: "14px", fontWeight: "600" }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: "12px", marginTop: "20px" }}>
          支援全人系統匯出的 JSON 格式
        </p>
      </div>
    </div>
  );
}
