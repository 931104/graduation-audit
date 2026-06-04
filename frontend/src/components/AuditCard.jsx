export default function AuditCard({
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
        width: "220px",
      }}
    >
      <h3>{title}</h3>

      <h1>{value}</h1>
    </div>
  );
}