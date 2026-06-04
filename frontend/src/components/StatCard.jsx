export default function StatCard({
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
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      <p
        style={{
          color: "#64748b",
          marginBottom: "10px",
        }}
      >
        {title}
      </p>

      <h1
        style={{
          margin: 0,
        }}
      >
        {value}
      </h1>
    </div>
  );
}