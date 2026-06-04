import { useContext } from "react";

import { StudentContext }
  from "../context/StudentContext";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function GPA() {
  const { studentData } =
    useContext(StudentContext);

  const data =
    studentData[0]["課業學習"];

  const total =
    data.totalAverageScore;

  const averageList =
    data.averageScoreList || [];

  // 學年由舊到新排序
  const chartData =
    [...averageList]
      .sort((a, b) => {
        const aKey =
          Number(a.academicYear) * 10 +
          Number(a.semester);

        const bKey =
          Number(b.academicYear) * 10 +
          Number(b.semester);

        return aKey - bKey;
      })
      .map((item) => ({
        semester:
          `${item.academicYear}-${item.semester}`,
        average:
          Number(item.averageScore),
      }));

  return (
    <div>
      <h1>
        📈 GPA 分析
      </h1>

      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <InfoCard
          title="班排名"
          value={
            total.rankingClass
          }
        />

        <InfoCard
          title="系排名"
          value={
            total.rankingDepartment
          }
        />

        <InfoCard
          title="總學分"
          value={
            total.totalCredits
          }
        />

        <InfoCard
          title="平均成績"
          value={
            total.averageScore
          }
        />
      </div>

      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          marginTop: "20px",
          height: "500px",
        }}
      >
        <h2>
          歷年平均成績趨勢
        </h2>

        <ResponsiveContainer
          width="100%"
          height="90%"
        >
          <LineChart
            data={chartData}
          >
            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="semester"
            />

            <YAxis
              domain={[
                0,
                100,
              ]}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="average"
              stroke="#2563eb"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InfoCard({
  title,
  value,
}) {
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
      <p
        style={{
          color: "#64748b",
        }}
      >
        {title}
      </p>

      <h1>{value}</h1>
    </div>
  );
}