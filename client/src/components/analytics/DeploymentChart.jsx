import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function DeploymentChart({ deploymentStatistics }) {
  const data = deploymentStatistics.records.map((row) => ({
    status: row.status,
    records: row.recordCount,
    units: row.unitCount,
  }));

  return (
    <section className="chart-card" aria-label="Deployment statistics">
      <h2>Deployment status</h2>
      <p className="stat-hint">{deploymentStatistics.semantics}</p>
      {data.length === 0 ? (
        <p className="empty-copy">No status data to chart.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
            <XAxis dataKey="status" stroke="#7f9aa3" />
            <YAxis allowDecimals={false} stroke="#7f9aa3" />
            <Tooltip
              contentStyle={{ background: "#10222d", border: "1px solid #234" }}
            />
            <Legend />
            <Bar dataKey="records" name="Records" fill="#5eead4" radius={[6, 6, 0, 0]} />
            <Bar
              dataKey="units"
              name="Units on those records"
              fill="#c4b5fd"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export default DeploymentChart;
