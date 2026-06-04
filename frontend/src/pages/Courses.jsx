import {
  useContext,
  useState,
} from "react";

import { StudentContext }
  from "../context/StudentContext";

export default function Courses() {
  const { studentData } =
    useContext(StudentContext);

  const [keyword, setKeyword] =
    useState("");

  const semesters =
    studentData[0]["課業學習"]
      .gradeRecordList || [];

  const courses = [];

  semesters.forEach((semester) => {
    semester.GradeRecords.forEach(
      (course) => {
        courses.push({
          year:
            semester.academicYear,
          semester:
            semester.semester,
          courseName:
            course.courseName,
          credit:
            course.credit,
          score:
            course.score,
        });
      }
    );
  });

  const filteredCourses =
    courses.filter((course) =>
      course.courseName.includes(
        keyword
      )
    );

  return (
    <div>
      <h1
        style={{
          marginBottom: "20px",
        }}
      >
        📚 修課紀錄
      </h1>

      <input
        type="text"
        placeholder="搜尋課程..."
        value={keyword}
        onChange={(e) =>
          setKeyword(
            e.target.value
          )
        }
        style={{
          width: "300px",
          padding: "10px",
          borderRadius: "8px",
          border:
            "1px solid #ccc",
          marginBottom: "20px",
        }}
      />

      <table
        style={{
          width: "100%",
          borderCollapse:
            "collapse",
          background: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <thead
          style={{
            background: "#0f172a",
            color: "white",
          }}
        >
          <tr>
            <th
              style={{
                padding: "12px",
              }}
            >
              學年
            </th>

            <th
              style={{
                padding: "12px",
              }}
            >
              學期
            </th>

            <th
              style={{
                padding: "12px",
              }}
            >
              課程名稱
            </th>

            <th
              style={{
                padding: "12px",
              }}
            >
              學分
            </th>

            <th
              style={{
                padding: "12px",
              }}
            >
              成績
            </th>
          </tr>
        </thead>

        <tbody>
          {filteredCourses.map(
            (course, index) => (
              <tr
                key={index}
                style={{
                  borderBottom:
                    "1px solid #eee",
                }}
              >
                <td
                  style={{
                    padding: "12px",
                  }}
                >
                  {course.year}
                </td>

                <td
                  style={{
                    padding: "12px",
                  }}
                >
                  {course.semester}
                </td>

                <td
                  style={{
                    padding: "12px",
                  }}
                >
                  {course.courseName}
                </td>

                <td
                  style={{
                    padding: "12px",
                  }}
                >
                  {course.credit}
                </td>

                <td
                  style={{
                    padding: "12px",
                    color:
                      Number(
                        course.score
                      ) >= 60
                        ? "#16a34a"
                        : "#dc2626",
                    fontWeight:
                      "bold",
                  }}
                >
                  {course.score}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      <div
        style={{
          marginTop: "15px",
          color: "#64748b",
        }}
      >
        共找到{" "}
        {
          filteredCourses.length
        }{" "}
        門課程
      </div>
    </div>
  );
}