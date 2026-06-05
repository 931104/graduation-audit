import { useEffect, useState } from "react";

const API = "http://localhost:8000";

function StatusCard({ title, value, color }) {
  return (
    <div
      style={{
        background: color,
        color: "white",
        padding: "20px",
        borderRadius: "12px",
        minWidth: "220px",
        flex: 1,
      }}
    >
      <h3>{title}</h3>
      <h2>{value}</h2>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        marginTop: "20px",
        borderRadius: "12px",
      }}
    >
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function Audit({ studentId }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/audit/${studentId}`)
      .then((r) => r.json())
      .then(setAudit)
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) return <div>載入中...</div>;
  if (!audit) return <div>載入失敗</div>;

  const { summary, required, group, general, physical, elective } = audit;

  return (
    <div>
      <h1>🎓 畢業審核</h1>

      {/* 狀態卡 */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "20px" }}>
        <StatusCard
          title="已修總學分"
          value={`${summary.total_earned.toFixed(1)} / ${summary.total_required}`}
          color="#2563eb"
        />
        <StatusCard
          title="剩餘總學分"
          value={(summary.total_required - summary.total_earned).toFixed(1)}
          color="#dc2626"
        />
      </div>

      {/* 畢業資格 */}
      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          borderRadius: "12px",
          background: summary.is_graduated ? "#dcfce7" : "#fee2e2",
        }}
      >
        <h2>{summary.is_graduated ? "✅ 符合畢業資格" : "❌ 尚未符合畢業資格"}</h2>
      </div>

      {/* 專業必修 */}
      <Section title={`📌 專業必修 ${required.is_passed ? "✅" : "❌"}`}>
        <p>
          已取得：{required.credits.toFixed(1)} / {required.required_credits} 學分
        </p>
        {required.missing.length > 0 && (
          <>
            <p style={{ color: "#dc2626" }}>尚缺課程：</p>
            <ul>
              {required.missing.map((name, i) => <li key={i}>{name}</li>)}
            </ul>
          </>
        )}
      </Section>

      {/* 群修 */}
      <Section title={`📚 專業群修 ${group.is_passed ? "✅" : "❌"}`}>
        <p>已計入：{group.used_credits.toFixed(1)} / {group.required_credits} 學分</p>
        <p>群A（需 6 學分）：{group.group_credits["群A"]?.toFixed(1)} 學分 {group.group_a_ok ? "✅" : "❌"}</p>
        <p>BCDE 達標群數：{group.domain_count} / 3 {group.domain_ok ? "✅" : "❌"}</p>
        {Object.entries(group.group_credits)
          .filter(([name]) => name !== "群A")
          .map(([name, credit]) => (
            <p key={name} style={{ marginLeft: "16px" }}>
              {name}：{credit.toFixed(1)} 學分
            </p>
          ))}
      </Section>

      {/* 通識 */}
      <Section title={`🌐 通識 ${general.is_passed ? "✅" : "❌"}`}>
        {Object.entries(general.display)
          .filter(([key]) => key !== "核通" && key !== "缺額")
          .map(([key, val]) => (
            <p key={key}>{key}：{val}</p>
          ))}
        <p>
          核通：{general.display["核通"].completed_count} / {general.display["核通"].required_domains} 領域
          （{general.display["核通"].completed_domains.join("、") || "無"}）
        </p>
        {Object.entries(general.display["缺額"]).some(([, v]) => v > 0) && (
          <>
            <p style={{ color: "#dc2626", marginTop: "10px" }}>尚缺：</p>
            <ul>
              {Object.entries(general.display["缺額"])
                .filter(([, v]) => v > 0)
                .map(([label, val]) => (
                  <li key={label}>{label}：{val.toFixed(1)} 學分</li>
                ))}
            </ul>
          </>
        )}
      </Section>

      {/* 體育 */}
      <Section title={`🏃 體育 ${physical.is_passed ? "✅" : "❌"}`}>
        <p>已修：{physical.used_credits.toFixed(1)} / {physical.required_credits} 學分</p>
        {physical.shortage > 0 && (
          <p style={{ color: "#dc2626" }}>尚缺：{physical.shortage.toFixed(1)} 學分</p>
        )}
      </Section>

      {/* 自由選修 */}
      <Section title={`🔖 自由選修 ${elective.is_passed ? "✅" : "❌"}`}>
        <p>
          已修：{elective.total_credits.toFixed(1)} / {elective.required_credits.toFixed(1)} 學分
        </p>
        {!elective.is_passed && (
          <p style={{ color: "#dc2626" }}>
            尚缺：{(elective.required_credits - elective.total_credits).toFixed(1)} 學分
          </p>
        )}
      </Section>
    </div>
  );
}
