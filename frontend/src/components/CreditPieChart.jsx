import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export default function CreditPieChart({
  earned,
  remain,
}) {
  const data = [
    {
      name: "已完成",
      value: earned,
    },
    {
      name: "尚缺",
      value: remain,
    },
  ];

  const COLORS = [
    "#22c55e",
    "#ef4444",
  ];

  return (
    <PieChart
      width={350}
      height={250}
    >
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        outerRadius={80}
        dataKey="value"
        label
      >
        {data.map(
          (entry, index) => (
            <Cell
              key={index}
              fill={
                COLORS[index]
              }
            />
          )
        )}
      </Pie>

      <Tooltip />
      <Legend />
    </PieChart>
  );
}