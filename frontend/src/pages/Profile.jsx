import { student } from "../data";

export default function Profile() {
  return (
    <div>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          width: "500px",
        }}
      >

        <h1>個人資料</h1>

        <hr />

        <p>
          <strong>姓名：</strong>
          {student.name}
        </p>

        <p>
          <strong>學號：</strong>
          {student.id}
        </p>

        <p>
          <strong>系所：</strong>
          {student.department}
        </p>

      </div>

    </div>
  );
}