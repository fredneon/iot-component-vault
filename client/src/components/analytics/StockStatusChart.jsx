import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function StockStatusChart({ stockSummary, thresholdRules }) {
  const data = [
    { name: "Healthy", value: stockSummary.healthy, fill: "#86efac" },
    { name: "Low stock", value: stockSummary.lowStock, fill: "#fbbf24" },
    { name: "Out of stock", value: stockSummary.outOfStock, fill: "#fb7185" },
  ];
  const total = data.reduce((sum, row) => sum + row.value, 0);

  return (
    <section className="chart-card" aria-label="Stock health">
      <h2>Stock health</h2>
      <p className="stat-hint">
        Out of stock: {thresholdRules.outOfStock}. Low stock:{" "}
        {thresholdRules.lowStock}. Healthy: {thresholdRules.healthy}. Missing
        thresholds default to {thresholdRules.defaultMinimumStock}.
      </p>
      {total === 0 ? (
        <p className="empty-copy">No records to chart.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
            <XAxis dataKey="name" stroke="#7f9aa3" />
            <YAxis allowDecimals={false} stroke="#7f9aa3" />
            <Tooltip
              contentStyle={{ background: "#10222d", border: "1px solid #234" }}
              formatter={(value) => [`${value} records`, "Count"]}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((row) => (
                <Cell key={row.name} fill={row.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export default StockStatusChart;
