import { useContext } from "react";
import { StudentContext } from "../context/StudentContext";

function StatusCard({
  title,
  value,
  color,
}) {
  return (
    <div
      style={{
        background: color,
        color: "white",
        padding: "20px",
        borderRadius: "12px",
        width: "250px",
      }}
    >
      <h3>{title}</h3>
      <h2>{value}</h2>
    </div>
  );
}

export default function Audit() {
  const { studentData } =
    useContext(StudentContext);

  const data =
    studentData[0]["課業學習"];

  const plan =
    data.coursePlan;

  const total =
    data.totalAverageScore;

  const earnedCredits =
    Number(total.totalCredits);

  const requiredCredits =
    Number(plan.graduationCredit);

  const remainCredits =
    requiredCredits -
    earnedCredits;

  const alerts = [
    plan.requiredRemark,
    plan.groupRemark,
    plan.liberalTotal,
    plan.commonPhysical,
  ].filter(
    (item) =>
      item &&
      item !== "[]" &&
      item.trim() !== ""
  );

  const graduation =
    remainCredits <= 0 &&
    alerts.length === 0;

  return (
    <div>
      <h1>
        🎓 畢業審核
      </h1>

      {/* 狀態卡 */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        <StatusCard
          title="已修學分"
          value={`${earnedCredits} / ${requiredCredits}`}
          color="#2563eb"
        />

        <StatusCard
          title="剩餘學分"
          value={remainCredits}
          color="#dc2626"
        />

        <StatusCard
          title="系排名"
          value={
            total.rankingDepartment
          }
          color="#16a34a"
        />
      </div>

      {/* 畢業資格 */}
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          borderRadius: "12px",
          background:
            graduation
              ? "#dcfce7"
              : "#fee2e2",
        }}
      >
        <h2>
          {graduation
            ? "✅ 符合畢業資格"
            : "❌ 尚未符合畢業資格"}
        </h2>

        {!graduation && (
          <p>
            目前已取得
            {" "}
            {earnedCredits}
            {" "}
            學分，
            尚缺
            {" "}
            {remainCredits}
            {" "}
            學分。
          </p>
        )}
      </div>

      {/* 尚缺項目 */}
      <div
        style={{
          background: "white",
          padding: "20px",
          marginTop: "20px",
          borderRadius: "12px",
        }}
      >
        <h2>
          ⚠ 尚缺項目
        </h2>

        {alerts.length === 0 ? (
          <p>
            無缺額項目
          </p>
        ) : (
          <ul>
            {alerts.map(
              (
                item,
                index
              ) => (
                <li
                  key={index}
                  style={{
                    marginBottom:
                      "10px",
                  }}
                >
                  {item}
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {/* 畢業門檻資訊 */}
      <div
        style={{
          background: "white",
          padding: "20px",
          marginTop: "20px",
          borderRadius: "12px",
        }}
      >
        <h2>
          📋 畢業門檻
        </h2>

        <p>
          總畢業學分：
          {" "}
          {plan.graduationCredit}
        </p>

        <p>
          必修需求：
          {" "}
          {plan.requiredPoint}
        </p>

        <p>
          群修需求：
          {" "}
          {plan.groupPoint}
        </p>
      </div>
    </div>
  );
}