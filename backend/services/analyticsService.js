import Component, { DEFAULT_MINIMUM_STOCK } from "../models/Component.js";

// Aggregation stages used below:
// $addFields — compute quantity/minStock defaults and stockBucket without mutating stored docs
// $facet — run several pipelines on the same matched set (totals, groups, alerts)
// $group — collapse documents by category, stock bucket, or status
// $project — reshape grouped rows into API field names
// $match — keep only low/out-of-stock rows for the alert table
// $sort — out-of-stock first (urgency 0), then lowest quantity


const emptyOverview = {
  totalRecords: 0,
  totalUnits: 0,
  categoryDistribution: [],
  stockSummary: {
    healthy: 0,
    lowStock: 0,
    outOfStock: 0,
  },
  lowStockCount: 0,
  outOfStockCount: 0,
  deploymentStatistics: {
    semantics:
      "Each record has one status (Available or Deployed). quantity is the total unit count for that record, not a split of available vs deployed stock within the same SKU.",
    records: [],
    availableRecords: 0,
    deployedRecords: 0,
    unknownRecords: 0,
    unitsOnAvailableRecords: 0,
    unitsOnDeployedRecords: 0,
  },
  lowStockComponents: [],
  thresholdRules: {
    defaultMinimumStock: DEFAULT_MINIMUM_STOCK,
    outOfStock: "quantity <= 0",
    lowStock: "quantity > 0 and quantity <= minimumStock",
    healthy: "quantity > minimumStock",
  },
};

const countByStatus = (rows, status) =>
  rows.find((row) => row.status === status)?.recordCount || 0;

const unitsByStatus = (rows, status) =>
  rows.find((row) => row.status === status)?.unitCount || 0;

export const getAnalyticsOverview = async () => {
  const [result] = await Component.aggregate([
    {
      $addFields: {
        quantitySafe: { $ifNull: ["$quantity", 0] },
        minStockSafe: { $ifNull: ["$minimumStock", DEFAULT_MINIMUM_STOCK] },
        categorySafe: {
          $cond: [
            {
              $or: [
                { $eq: [{ $ifNull: ["$category", ""] }, ""] },
                { $eq: ["$category", null] },
              ],
            },
            "Uncategorized",
            "$category",
          ],
        },
        statusSafe: {
          $cond: [
            {
              $or: [
                { $eq: [{ $ifNull: ["$status", ""] }, ""] },
                { $eq: ["$status", null] },
              ],
            },
            "Unknown",
            "$status",
          ],
        },
      },
    },
    {
      $addFields: {
        stockBucket: {
          $switch: {
            branches: [
              { case: { $lte: ["$quantitySafe", 0] }, then: "outOfStock" },
              {
                case: { $lte: ["$quantitySafe", "$minStockSafe"] },
                then: "lowStock",
              },
            ],
            default: "healthy",
          },
        },
      },
    },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalRecords: { $sum: 1 },
              totalUnits: { $sum: "$quantitySafe" },
            },
          },
        ],
        byCategory: [
          {
            $group: {
              _id: "$categorySafe",
              recordCount: { $sum: 1 },
              unitCount: { $sum: "$quantitySafe" },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              category: "$_id",
              recordCount: 1,
              unitCount: 1,
            },
          },
        ],
        byStock: [
          {
            $group: {
              _id: "$stockBucket",
              recordCount: { $sum: 1 },
            },
          },
        ],
        byStatus: [
          {
            $group: {
              _id: "$statusSafe",
              recordCount: { $sum: 1 },
              unitCount: { $sum: "$quantitySafe" },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              status: "$_id",
              recordCount: 1,
              unitCount: 1,
            },
          },
        ],
        alerts: [
          {
            $match: {
              stockBucket: { $in: ["lowStock", "outOfStock"] },
            },
          },
          {
            $addFields: {
              urgency: {
                $cond: [{ $eq: ["$stockBucket", "outOfStock"] }, 0, 1],
              },
            },
          },
          { $sort: { urgency: 1, quantitySafe: 1, name: 1 } },
          {
            $project: {
              _id: 1,
              name: 1,
              category: "$categorySafe",
              quantity: "$quantitySafe",
              minimumStock: "$minStockSafe",
              location: { $ifNull: ["$location", ""] },
              severity: "$stockBucket",
            },
          },
        ],
      },
    },
  ]);

  if (!result) {
    return emptyOverview;
  }

  const totals = result.totals[0] || { totalRecords: 0, totalUnits: 0 };
  const stockMap = Object.fromEntries(
    (result.byStock || []).map((row) => [row._id, row.recordCount])
  );
  const statusRows = result.byStatus || [];

  return {
    totalRecords: totals.totalRecords || 0,
    totalUnits: totals.totalUnits || 0,
    categoryDistribution: result.byCategory || [],
    stockSummary: {
      healthy: stockMap.healthy || 0,
      lowStock: stockMap.lowStock || 0,
      outOfStock: stockMap.outOfStock || 0,
    },
    lowStockCount: stockMap.lowStock || 0,
    outOfStockCount: stockMap.outOfStock || 0,
    deploymentStatistics: {
      ...emptyOverview.deploymentStatistics,
      records: statusRows,
      availableRecords: countByStatus(statusRows, "Available"),
      deployedRecords: countByStatus(statusRows, "Deployed"),
      unknownRecords: countByStatus(statusRows, "Unknown"),
      unitsOnAvailableRecords: unitsByStatus(statusRows, "Available"),
      unitsOnDeployedRecords: unitsByStatus(statusRows, "Deployed"),
    },
    lowStockComponents: result.alerts || [],
    thresholdRules: emptyOverview.thresholdRules,
  };
};
