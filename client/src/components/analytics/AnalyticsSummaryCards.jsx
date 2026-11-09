import { Boxes, ClipboardList, PackageX, Radio, TriangleAlert } from "lucide-react";

function AnalyticsSummaryCards({ overview }) {
  const cards = [
    {
      label: "Component records",
      value: overview.totalRecords,
      hint: "One row per inventory SKU",
      icon: ClipboardList,
      tone: "cyan",
    },
    {
      label: "Physical units",
      value: overview.totalUnits,
      hint: "Sum of quantity across records",
      icon: Boxes,
      tone: "green",
    },
    {
      label: "Low-stock records",
      value: overview.lowStockCount,
      hint: "Qty above 0 and at or below minimum",
      icon: TriangleAlert,
      tone: "amber",
    },
    {
      label: "Out-of-stock records",
      value: overview.outOfStockCount,
      hint: "Quantity is 0",
      icon: PackageX,
      tone: "rose",
    },
    {
      label: "Deployed records",
      value: overview.deploymentStatistics.deployedRecords,
      hint: `${overview.deploymentStatistics.unitsOnDeployedRecords} units on those records`,
      icon: Radio,
      tone: "violet",
    },
  ];

  return (
    <section className="stats-grid analytics-kpis" aria-label="Analytics summary">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <article key={card.label} className={`stat-card tone-${card.tone}`}>
            <div className="stat-icon" aria-hidden="true">
              <Icon size={20} />
            </div>
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
            <p className="stat-hint">{card.hint}</p>
          </article>
        );
      })}
    </section>
  );
}

export default AnalyticsSummaryCards;
