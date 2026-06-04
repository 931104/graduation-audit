import { useContext } from "react";

import { StudentContext }
  from "../context/StudentContext";

import StatCard
  from "../components/StatCard";

import CreditPieChart
  from "../components/CreditPieChart";

export default function Dashboard() {
  const { studentData } =
    useContext(StudentContext);

  const data =
    studentData[0]["課業學習"];

  const student =
    data.aboutMe;

  const total =
    data.totalAverageScore;

  const plan =
    data.coursePlan;

  const earnedCredits =
    Number(total.totalCredits);

  const requiredCredits =
    Number(plan.graduationCredit);

  const remainCredits =
    requiredCredits -
    earnedCredits;

  const progress =
    (
      (earnedCredits /
        requiredCredits) *
      100
    ).toFixed(1);

  const averageScore =
    total.averageScore;

  const semesters =
    data.gradeRecordList || [];

  const latestSemester =
  semesters[0];

  const latestCourses =
    latestSemester?.GradeRecords?.slice(
      0,
      5
    ) || [];

  const alerts = [
    plan.requiredRemark,
    plan.liberalTotal,
    plan.commonPhysical,
  ].filter(Boolean);

  return (
    <div>
      {/* 上方區塊 */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          alignItems: "stretch",
        }}
      >
        {/* 學生資訊 */}
        <div
          style={{
            flex: 1,
            background: "white",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          <h1>
            {student.chineseName}
          </h1>

          <p>
            學號：
            {student.studentNumber}
          </p>

          <p>
            系所：
            {student.registerMajor}
          </p>

          <p>
            年級：
            {
              student.departmentProgramGrade
            }
          </p>
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
          <h2>
            學分完成比例
          </h2>

          <CreditPieChart
            earned={
              earnedCredits
            }
            remain={
              remainCredits
            }
          />
        </div>
      </div>

      {/* 統計卡 */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginTop: "20px",
        }}
      >
        <StatCard
          title="已修學分"
          value={
            earnedCredits
          }
        />

        <StatCard
          title="剩餘學分"
          value={
            remainCredits
          }
        />

        <StatCard
          title="完成率"
          value={`${progress}%`}
        />

        <StatCard
          title="系排名"
          value={
            total.rankingDepartment
          }
        />

        <StatCard
          title="平均成績"
          value={averageScore}
        />
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
        <h2>
          畢業進度
        </h2>

        <p>
          已完成：
          {earnedCredits}
          學分
        </p>

        <p>
          尚缺：
          {remainCredits}
          學分
        </p>

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
              width: `${progress}%`,
              height: "100%",
              background:
                "#22c55e",
              borderRadius:
                "20px",
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
        <h2>
          最近修課紀錄
        </h2>

        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding:
                    "10px",
                }}
              >
                課程
              </th>

              <th
                style={{
                  padding:
                    "10px",
                }}
              >
                學分
              </th>

              <th
                style={{
                  padding:
                    "10px",
                }}
              >
                成績
              </th>
            </tr>
          </thead>

          <tbody>
            {latestCourses.map(
              (
                course,
                index
              ) => (
                <tr
                  key={index}
                >
                  <td
                    style={{
                      padding:
                        "10px",
                    }}
                  >
                    {
                      course.courseName
                    }
                  </td>

                  <td>
                    {
                      course.credit
                    }
                  </td>

                  <td
                    style={{
                      color:
                        Number(
                          course.score
                        ) >=
                        60
                          ? "green"
                          : "red",
                      fontWeight:
                        "bold",
                    }}
                  >
                    {
                      course.score
                    }
                  </td>
                </tr>
              )
            )}
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
        <h2>
          ⚠ 畢業提醒
        </h2>

        {alerts.map(
          (item, index) => (
            <div
              key={index}
              style={{
                background:
                  "#fef3c7",
                padding:
                  "12px",
                borderRadius:
                  "8px",
                marginBottom:
                  "10px",
              }}
            >
              {item}
            </div>
          )
        )}
      </div>
    </div>
  );
}