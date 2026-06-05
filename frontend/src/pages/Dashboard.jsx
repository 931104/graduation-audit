import { useContext } from "react";
import { StudentContext } from "../context/StudentContext";

export default function Dashboard() {
  const { studentData } =
    useContext(StudentContext);

  const data =
    studentData[0]["課業學習"];

  const student =
    studentData[0]["學生基本資料"];

  const total =
    data.totalAverageScore;

  const earnedCredits =
    Number(total.totalCredits);

  const requiredCredits = 128;

  const remainCredits =
    requiredCredits -
    earnedCredits;

  const progress =
    (
      (earnedCredits /
        requiredCredits) *
      100
    ).toFixed(1);

  return (
    <div>
      {/* 測試區塊 */}
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
          如果你看到這段文字，
          代表 Vercel 已成功更新。
        </p>
      </div>

      {/* 學生資訊 */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h2>
          {student.chineseName}
        </h2>

        <p>
          學號：
          {student.studentId}
        </p>

        <p>
          系所：
          {student.department}
        </p>

        <p>
          年級：
          {student.grade}
        </p>
      </div>

      {/* 統計卡 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px,1fr))",
          gap: "20px",
        }}
      >
        <Card
          title="已修學分"
          value={earnedCredits}
        />

        <Card
          title="剩餘學分"
          value={remainCredits}
        />

        <Card
          title="完成率"
          value={`${progress}%`}
        />

        <Card
          title="系排名"
          value={
            total.rankingDepartment
          }
        />
      </div>

      {/* 進度條 */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
        }}
      >
        <h3>
          學分完成比例
        </h3>

        <p>
          已完成：
          {earnedCredits}
        </p>

        <p>
          尚缺：
          {remainCredits}
        </p>

        <div
          style={{
            width: "100%",
            height: "30px",
            background: "#e5e7eb",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#22c55e",
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  value,
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
      }}
    >
      <p
        style={{
          color: "#64748b",
        }}
      >
        {title}
      </p>

      <h2>{value}</h2>
    </div>
  );
}