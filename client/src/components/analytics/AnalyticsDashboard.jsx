import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { getAnalyticsOverview, getApiErrorMessage } from "../../api/client.js";
import { MenuToggle } from "../AppLayout.jsx";
import AnalyticsSummaryCards from "./AnalyticsSummaryCards.jsx";
import CategoryDistributionChart from "./CategoryDistributionChart.jsx";
import StockStatusChart from "./StockStatusChart.jsx";
import DeploymentChart from "./DeploymentChart.jsx";
import LowStockTable from "./LowStockTable.jsx";

function AnalyticsDashboard() {
  const { sidebarOpen, setSidebarOpen } = useOutletContext();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getAnalyticsOverview();
      setOverview(data);
    } catch (err) {
      setOverview(null);
      setError(getApiErrorMessage(err, "Could not load analytics."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
    <>
      <header className="topbar">
        <MenuToggle sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div>
          <h1>Inventory analytics</h1>
          <p className="subtitle">
            Live totals from MongoDB. Records are SKUs; units are summed
            quantities.
          </p>
        </div>
        <div className="topbar-actions">
          <button
            type="button"
            className="btn ghost"
            onClick={loadOverview}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh analytics
          </button>
        </div>
      </header>

      <main className="content">
        {loading && (
          <div className="table-card" role="status">
            <p className="empty-copy">Loading analytics…</p>
          </div>
        )}

        {!loading && error && (
          <div className="banner error" role="alert">
            <p>{error}</p>
            <button type="button" className="btn ghost" onClick={loadOverview}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && overview && (
          <>
            <AnalyticsSummaryCards overview={overview} />
            <div className="chart-grid">
              <CategoryDistributionChart
                rows={overview.categoryDistribution}
                totalRecords={overview.totalRecords}
                totalUnits={overview.totalUnits}
              />
              <StockStatusChart
                stockSummary={overview.stockSummary}
                thresholdRules={overview.thresholdRules}
              />
            </div>
            <DeploymentChart
              deploymentStatistics={overview.deploymentStatistics}
            />
            <LowStockTable rows={overview.lowStockComponents} />
          </>
        )}
      </main>
    </>
  );
}

export default AnalyticsDashboard;
