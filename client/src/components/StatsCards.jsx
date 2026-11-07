import { Boxes, CircleCheck, Radio, TriangleAlert } from "lucide-react";

function StatsCards({ totalUnits, availableUnits, deployedUnits, lowStockTypes }) {
  const cards = [
    {
      label: "Total units",
      value: totalUnits,
      hint: "Sum of all quantities",
      icon: Boxes,
      tone: "cyan",
    },
    {
      label: "Available units",
      value: availableUnits,
      hint: "Ready for checkout",
      icon: CircleCheck,
      tone: "green",
    },
    {
      label: "Deployed units",
      value: deployedUnits,
      hint: "Currently in the field",
      icon: Radio,
      tone: "violet",
    },
    {
      label: "Low-stock types",
      value: lowStockTypes,
      hint: "Quantity 2 or fewer",
      icon: TriangleAlert,
      tone: "amber",
    },
  ];

  return (
    <section className="stats-grid" aria-label="Inventory statistics">
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

export default StatsCards;
