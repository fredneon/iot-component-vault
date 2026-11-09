import { Link } from "react-router-dom";

function LowStockTable({ rows }) {
  return (
    <section className="chart-card" aria-label="Low-stock alerts">
      <h2>Low-stock alerts</h2>
      <p className="stat-hint">
        Out-of-stock records are listed first. Severity is also written as text.
      </p>
      {rows.length === 0 ? (
        <p className="empty-copy">No low-stock or out-of-stock records.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Category</th>
                <th scope="col">Quantity</th>
                <th scope="col">Minimum</th>
                <th scope="col">Location</th>
                <th scope="col">Severity</th>
                <th scope="col">View</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.category}</td>
                  <td>{row.quantity}</td>
                  <td>{row.minimumStock}</td>
                  <td>{row.location || "—"}</td>
                  <td>
                    <span
                      className={
                        row.severity === "outOfStock" ? "out-badge" : "low-badge"
                      }
                    >
                      {row.severity === "outOfStock"
                        ? "Out of stock"
                        : "Low stock"}
                    </span>
                  </td>
                  <td>
                    <Link className="btn ghost" to={`/components/${row._id}`}>
                      View component
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default LowStockTable;
