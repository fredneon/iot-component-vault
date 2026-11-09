import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import Component from "../models/Component.js";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../.."
);

describe("Inventory analytics", { timeout: 180000 }, () => {
  let mongo;
  let app;

  before(async () => {
    mongo = await MongoMemoryServer.create({
      instance: { launchTimeout: 120000 },
    });
    await mongoose.connect(mongo.getUri());
    app = createApp();
  });

  beforeEach(async () => {
    await Component.deleteMany({});
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  });

  it("returns zeros for an empty inventory", async () => {
    const response = await request(app).get("/api/analytics/overview");

    assert.equal(response.status, 200);
    assert.equal(response.body.totalRecords, 0);
    assert.equal(response.body.totalUnits, 0);
    assert.deepEqual(response.body.categoryDistribution, []);
    assert.deepEqual(response.body.stockSummary, {
      healthy: 0,
      lowStock: 0,
      outOfStock: 0,
    });
    assert.equal(response.body.lowStockCount, 0);
    assert.equal(response.body.outOfStockCount, 0);
    assert.deepEqual(response.body.lowStockComponents, []);
  });

  it("groups categories by record count and unit count", async () => {
    await Component.create([
      {
        name: "ESP32",
        category: "Microcontroller",
        quantity: 4,
        status: "Available",
        minimumStock: 2,
      },
      {
        name: "Pico",
        category: "Microcontroller",
        quantity: 6,
        status: "Available",
        minimumStock: 2,
      },
      {
        name: "DHT22",
        category: "Sensor",
        quantity: 10,
        status: "Available",
        minimumStock: 2,
      },
    ]);

    const response = await request(app).get("/api/analytics/overview");
    const micro = response.body.categoryDistribution.find(
      (row) => row.category === "Microcontroller"
    );
    const sensor = response.body.categoryDistribution.find(
      (row) => row.category === "Sensor"
    );

    assert.equal(response.body.totalRecords, 3);
    assert.equal(response.body.totalUnits, 20);
    assert.equal(micro.recordCount, 2);
    assert.equal(micro.unitCount, 10);
    assert.equal(sensor.recordCount, 1);
    assert.equal(sensor.unitCount, 10);
  });

  it("treats quantity equal to minimumStock as low stock", async () => {
    await Component.create({
      name: "Boundary kit",
      category: "Development Kit",
      quantity: 5,
      status: "Available",
      minimumStock: 5,
    });

    const response = await request(app).get("/api/analytics/overview");

    assert.equal(response.body.stockSummary.lowStock, 1);
    assert.equal(response.body.stockSummary.healthy, 0);
    assert.equal(response.body.lowStockComponents[0].severity, "lowStock");
  });

  it("treats quantity 0 as out of stock", async () => {
    await Component.create({
      name: "Empty reel",
      category: "Other",
      quantity: 0,
      status: "Available",
      minimumStock: 5,
    });

    const response = await request(app).get("/api/analytics/overview");

    assert.equal(response.body.outOfStockCount, 1);
    assert.equal(response.body.lowStockCount, 0);
    assert.equal(response.body.lowStockComponents[0].severity, "outOfStock");
  });

  it("applies default minimumStock of 5 to legacy records", async () => {
    await Component.collection.insertOne({
      name: "Legacy MCU",
      category: "Microcontroller",
      quantity: 4,
      status: "Available",
    });

    const response = await request(app).get("/api/analytics/overview");

    assert.equal(response.body.lowStockCount, 1);
    assert.equal(response.body.lowStockComponents[0].minimumStock, 5);
  });

  it("labels missing category and status", async () => {
    await Component.collection.insertOne({
      name: "Mystery part",
      quantity: 8,
      minimumStock: 1,
    });

    const response = await request(app).get("/api/analytics/overview");
    const category = response.body.categoryDistribution[0];
    const statusRow = response.body.deploymentStatistics.records[0];

    assert.equal(category.category, "Uncategorized");
    assert.equal(statusRow.status, "Unknown");
    assert.equal(response.body.deploymentStatistics.unknownRecords, 1);
  });

  it("reports deployment as record-level status plus units on those records", async () => {
    await Component.create([
      {
        name: "Bench ESP32",
        category: "Microcontroller",
        quantity: 3,
        status: "Available",
        minimumStock: 1,
      },
      {
        name: "Field node",
        category: "Microcontroller",
        quantity: 7,
        status: "Deployed",
        minimumStock: 1,
      },
    ]);

    const response = await request(app).get("/api/analytics/overview");
    const stats = response.body.deploymentStatistics;

    assert.match(stats.semantics, /record/);
    assert.equal(stats.availableRecords, 1);
    assert.equal(stats.deployedRecords, 1);
    assert.equal(stats.unitsOnAvailableRecords, 3);
    assert.equal(stats.unitsOnDeployedRecords, 7);
  });

  it("sorts alerts with out-of-stock first", async () => {
    await Component.create([
      {
        name: "Low sensor",
        category: "Sensor",
        quantity: 2,
        status: "Available",
        minimumStock: 5,
      },
      {
        name: "Gone kit",
        category: "Development Kit",
        quantity: 0,
        status: "Available",
        minimumStock: 5,
      },
    ]);

    const response = await request(app).get("/api/analytics/overview");
    const names = response.body.lowStockComponents.map((item) => item.name);

    assert.deepEqual(names, ["Gone kit", "Low sensor"]);
    assert.equal(response.body.lowStockComponents[0].severity, "outOfStock");
  });

  it("wires analytics navigation, empty UI, and detail links", async () => {
    const appSource = await readFile(
      path.join(repoRoot, "client/src/App.jsx"),
      "utf8"
    );
    const dashboard = await readFile(
      path.join(repoRoot, "client/src/components/analytics/AnalyticsDashboard.jsx"),
      "utf8"
    );
    const table = await readFile(
      path.join(repoRoot, "client/src/components/analytics/LowStockTable.jsx"),
      "utf8"
    );
    const categoryChart = await readFile(
      path.join(
        repoRoot,
        "client/src/components/analytics/CategoryDistributionChart.jsx"
      ),
      "utf8"
    );

    assert.match(appSource, /path="\/analytics"/);
    assert.match(dashboard, /Loading analytics/);
    assert.match(dashboard, /Retry/);
    assert.match(table, /No low-stock or out-of-stock records/);
    assert.match(table, /\/components\/\$\{row\._id\}/);
    assert.match(categoryChart, /percentages are omitted/);
  });

  it("treats quantity above the threshold as healthy", async () => {
    await Component.create({
      name: "Healthy pile",
      category: "Other",
      quantity: 12,
      status: "Available",
      minimumStock: 5,
    });

    const response = await request(app).get("/api/analytics/overview");

    assert.equal(response.body.stockSummary.healthy, 1);
    assert.equal(response.body.lowStockComponents.length, 0);
  });
});
