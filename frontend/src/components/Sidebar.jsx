import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen p-6">

      <h2 className="text-2xl font-bold mb-8">
        🎓 Graduation Audit
      </h2>

      <div className="flex flex-col gap-3">

        <Link
          className="bg-slate-800 p-3 rounded-lg"
          to="/"
        >
          📊 Dashboard
        </Link>

        <Link
          className="bg-slate-800 p-3 rounded-lg"
          to="/audit"
        >
          🎓 畢業審核
        </Link>

        <Link
          className="bg-slate-800 p-3 rounded-lg"
          to="/courses"
        >
          📚 修課紀錄
        </Link>

        <Link
          className="bg-slate-800 p-3 rounded-lg"
          to="/gpa"
        >
          📈 GPA
        </Link>

        <Link
          className="bg-slate-800 p-3 rounded-lg"
          to="/profile"
        >
          👤 個人資料
        </Link>

      </div>

    </div>
  );
}