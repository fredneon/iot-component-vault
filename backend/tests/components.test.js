import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import Component from "../models/Component.js";

const sample = {
  name: "ESP32 DevKit",
  category: "Microcontroller",
  manufacturer: "Espressif",
  quantity: 4,
  status: "Available",
  location: "Drawer A",
  notes: "Wi-Fi board",
};

describe("Component Vault API", { timeout: 180000 }, () => {
  let mongo;
  let app;

  before(async () => {
    mongo = await MongoMemoryServer.create({
      instance: {
        launchTimeout: 120000,
      },
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

  it("GET /api/health returns ok", async () => {
    const response = await request(app).get("/api/health");

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
  });

  it("GET /api/components returns an empty list", async () => {
    const response = await request(app).get("/api/components");

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, []);
  });

  it("POST /api/components creates a component", async () => {
    const response = await request(app).post("/api/components").send(sample);

    assert.equal(response.status, 201);
    assert.equal(response.body.name, sample.name);
    assert.equal(response.body.quantity, 4);
    assert.ok(response.body._id);
  });

  it("POST /api/components rejects missing name", async () => {
    const response = await request(app)
      .post("/api/components")
      .send({ ...sample, name: "" });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /name/i);
  });

  it("POST /api/components rejects an invalid category", async () => {
    const response = await request(app)
      .post("/api/components")
      .send({ ...sample, category: "Cable" });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /category/i);
  });

  it("POST /api/components rejects a negative quantity", async () => {
    const response = await request(app)
      .post("/api/components")
      .send({ ...sample, quantity: -1 });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /quantity/i);
  });

  it("GET /api/components returns created records", async () => {
    await Component.create(sample);
    const response = await request(app).get("/api/components");

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].name, sample.name);
  });

  it("PUT /api/components/:id updates a component", async () => {
    const created = await Component.create(sample);
    const response = await request(app)
      .put(`/api/components/${created._id}`)
      .send({ quantity: 1, status: "Deployed" });

    assert.equal(response.status, 200);
    assert.equal(response.body.quantity, 1);
    assert.equal(response.body.status, "Deployed");
  });

  it("PUT /api/components/:id rejects an invalid id", async () => {
    const response = await request(app)
      .put("/api/components/not-a-valid-id")
      .send({ name: "Updated" });

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Invalid component ID");
  });

  it("PUT /api/components/:id returns 404 for a missing document", async () => {
    const missingId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .put(`/api/components/${missingId}`)
      .send({ name: "Updated" });

    assert.equal(response.status, 404);
    assert.equal(response.body.message, "Component not found");
  });

  it("DELETE /api/components/:id removes a component", async () => {
    const created = await Component.create(sample);
    const response = await request(app).delete(
      `/api/components/${created._id}`
    );

    assert.equal(response.status, 200);
    assert.equal(response.body.message, "Component deleted");
    assert.equal(await Component.countDocuments(), 0);
  });

  it("DELETE /api/components/:id rejects a 12-character fake id", async () => {
    const response = await request(app).delete(
      "/api/components/abcdefghijkl"
    );

    assert.equal(response.status, 400);
    assert.equal(response.body.message, "Invalid component ID");
  });

  it("allows the Vite origin through CORS", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "http://localhost:5173");

    assert.equal(response.status, 200);
    assert.equal(
      response.headers["access-control-allow-origin"],
      "http://localhost:5173"
    );
  });
});
