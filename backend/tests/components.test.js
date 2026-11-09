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

  it("POST /api/components saves hardware metadata", async () => {
    const response = await request(app)
      .post("/api/components")
      .send({
        ...sample,
        architecture: "Xtensa LX6",
        operatingVoltage: 3.3,
        communicationProtocols: ["UART", "I2C", "Wi-Fi"],
        datasheetUrl: "https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf",
      });

    assert.equal(response.status, 201);
    assert.equal(response.body.architecture, "Xtensa LX6");
    assert.equal(response.body.operatingVoltage, 3.3);
    assert.deepEqual(response.body.communicationProtocols, [
      "UART",
      "I2C",
      "Wi-Fi",
    ]);
    assert.match(response.body.datasheetUrl, /^https:\/\//);
  });

  it("PUT /api/components/:id updates hardware metadata", async () => {
    const created = await Component.create(sample);
    const response = await request(app)
      .put(`/api/components/${created._id}`)
      .send({
        architecture: "ARM Cortex-M4",
        operatingVoltage: 5,
        communicationProtocols: ["SPI", "I²C"],
        datasheetUrl: "https://example.com/mcu.pdf",
      });

    assert.equal(response.status, 200);
    assert.equal(response.body.architecture, "ARM Cortex-M4");
    assert.equal(response.body.operatingVoltage, 5);
    assert.deepEqual(response.body.communicationProtocols, ["SPI", "I2C"]);
  });

  it("GET /api/components returns saved hardware metadata", async () => {
    await Component.create({
      ...sample,
      architecture: "RISC-V",
      operatingVoltage: 1.8,
      communicationProtocols: ["GPIO", "PWM"],
      datasheetUrl: "https://example.com/riscv.pdf",
    });

    const response = await request(app).get("/api/components");

    assert.equal(response.status, 200);
    assert.equal(response.body[0].architecture, "RISC-V");
    assert.equal(response.body[0].operatingVoltage, 1.8);
    assert.deepEqual(response.body[0].communicationProtocols, ["GPIO", "PWM"]);
  });

  it("GET /api/components still returns old records without metadata", async () => {
    await Component.create(sample);
    const response = await request(app).get("/api/components");

    assert.equal(response.status, 200);
    assert.equal(response.body[0].name, sample.name);
    assert.equal(response.body[0].architecture, undefined);
    assert.equal(response.body[0].operatingVoltage, undefined);
  });

  it("PUT /api/components/:id does not clear metadata on unrelated edits", async () => {
    const created = await Component.create({
      ...sample,
      architecture: "AVR 8-bit",
      operatingVoltage: 5,
      communicationProtocols: ["UART"],
    });

    const response = await request(app)
      .put(`/api/components/${created._id}`)
      .send({ quantity: 9 });

    assert.equal(response.status, 200);
    assert.equal(response.body.quantity, 9);
    assert.equal(response.body.architecture, "AVR 8-bit");
    assert.equal(response.body.operatingVoltage, 5);
    assert.deepEqual(response.body.communicationProtocols, ["UART"]);
  });

  it("POST /api/components rejects a negative voltage", async () => {
    const response = await request(app)
      .post("/api/components")
      .send({ ...sample, operatingVoltage: -3.3 });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /voltage/i);
  });

  it("POST /api/components rejects an invalid datasheet URL", async () => {
    const response = await request(app)
      .post("/api/components")
      .send({ ...sample, datasheetUrl: "ftp://files.example.com/chip.pdf" });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /datasheet/i);
  });

  it("POST /api/components rejects an invalid communication protocol", async () => {
    const response = await request(app)
      .post("/api/components")
      .send({ ...sample, communicationProtocols: ["UART", "Zigbee"] });

    assert.equal(response.status, 400);
    assert.match(response.body.message, /protocol/i);
  });

  it("POST /api/components removes duplicate protocols", async () => {
    const response = await request(app)
      .post("/api/components")
      .send({
        ...sample,
        communicationProtocols: ["UART", "uart", "I2C", "I²C"],
      });

    assert.equal(response.status, 201);
    assert.deepEqual(response.body.communicationProtocols, ["UART", "I2C"]);
  });

  it("allows the Vercel origin through CORS", async () => {
    const response = await request(app)
      .get("/api/health")
      .set("Origin", "https://iot-component-vault.vercel.app");

    assert.equal(response.status, 200);
    assert.equal(
      response.headers["access-control-allow-origin"],
      "https://iot-component-vault.vercel.app"
    );
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
