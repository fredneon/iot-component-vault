import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#5eead4", "#86efac", "#c4b5fd", "#fbbf24", "#fb7185"];

function CategoryDistributionChart({ rows, totalRecords, totalUnits }) {
  const [metric, setMetric] = useState("recordCount");
  const total = metric === "recordCount" ? totalRecords : totalUnits;
  const data = rows.map((row) => ({
    name: row.category,
    value: row[metric],
  }));

  return (
    <section className="chart-card" aria-label="Category distribution">
      <div className="chart-header">
        <div>
          <h2>Category distribution</h2>
          <p className="stat-hint">
            Toggle records vs physical units. Percentages use the selected total.
          </p>
        </div>
        <div className="metric-toggle" role="group" aria-label="Category metric">
          <button
            type="button"
            className={`btn ghost ${metric === "recordCount" ? "active-toggle" : ""}`}
            onClick={() => setMetric("recordCount")}
          >
            Records
          </button>
          <button
            type="button"
            className={`btn ghost ${metric === "unitCount" ? "active-toggle" : ""}`}
            onClick={() => setMetric("unitCount")}
          >
            Units
          </button>
        </div>
      </div>

      {total === 0 ? (
        <p className="empty-copy">No inventory yet, so percentages are omitted.</p>
      ) : (
        <div className="chart-body">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#10222d", border: "1px solid #234" }}
                formatter={(value, name) => [
                  `${value} (${Math.round((value / total) * 100)}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="chart-legend">
            {data.map((entry, index) => (
              <li key={entry.name}>
                <span
                  className="legend-swatch"
                  style={{ background: COLORS[index % COLORS.length] }}
                />
                {entry.name}: {entry.value}{" "}
                ({Math.round((entry.value / total) * 100)}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default CategoryDistributionChart;
