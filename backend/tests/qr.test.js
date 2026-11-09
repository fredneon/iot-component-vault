import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import QRCode from "qrcode";
import request from "supertest";
import { createApp } from "../app.js";
import Component from "../models/Component.js";
import {
  getComponentQrUrl,
  getPublicAppBaseUrl,
  isLocalhostUrl,
  toQrFilename,
} from "../utils/qrUrl.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

describe("QR identification", { timeout: 180000 }, () => {
  let mongo;
  let app;

  before(async () => {
    mongo = await MongoMemoryServer.create({
      instance: { launchTimeout: 120000 },
    });
    await mongoose.connect(mongo.getUri());
    app = createApp();
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongo) {
      await mongo.stop();
    }
  });

  it("builds a QR URL from an existing component ID", () => {
    const id = "64b1c2d3e4f5a6b7c8d9e0f1";
    const url = getComponentQrUrl(id, "https://iot-component-vault.vercel.app");

    assert.equal(
      url,
      "https://iot-component-vault.vercel.app/components/64b1c2d3e4f5a6b7c8d9e0f1"
    );
  });

  it("creates unique QR URLs for different component IDs", () => {
    const first = getComponentQrUrl("64b1c2d3e4f5a6b7c8d9e0f1");
    const second = getComponentQrUrl("64b1c2d3e4f5a6b7c8d9e0f2");

    assert.notEqual(first, second);
  });

  it("keeps the QR URL stable after a component is edited", async () => {
    const created = await Component.create({
      name: "Arduino Uno R3",
      category: "Microcontroller",
      quantity: 2,
      status: "Available",
    });
    const beforeEdit = getComponentQrUrl(created._id);

    await request(app)
      .put(`/api/components/${created._id}`)
      .send({ name: "Arduino Uno Rev3", quantity: 6 });

    const afterEdit = await Component.findById(created._id);
    assert.equal(getComponentQrUrl(afterEdit._id), beforeEdit);
    await Component.findByIdAndDelete(created._id);
  });

  it("does not encode localhost in production QR URLs", () => {
    const url = getComponentQrUrl(
      "64b1c2d3e4f5a6b7c8d9e0f1",
      "http://localhost:5173"
    );

    assert.equal(isLocalhostUrl(url), false);
    assert.equal(getPublicAppBaseUrl("http://127.0.0.1:5173"), "https://iot-component-vault.vercel.app");
  });

  it("downloads a high-resolution PNG QR code", async () => {
    const url = getComponentQrUrl("64b1c2d3e4f5a6b7c8d9e0f1");
    const png = await QRCode.toBuffer(url, {
      type: "png",
      width: 1024,
      margin: 4,
      color: { dark: "#111111", light: "#ffffff" },
    });

    assert.equal(png[0], 0x89);
    assert.equal(png[1], 0x50);
    assert.equal(png[2], 0x4e);
    assert.equal(png[3], 0x47);
    assert.equal(toQrFilename("Arduino Uno R3"), "Arduino-Uno-R3-QR.png");
    assert.ok(png.length > 1000);
  });

  it("configures the component detail route and Vercel SPA rewrite", async () => {
    const appSource = await readFile(
      path.join(repoRoot, "client/src/App.jsx"),
      "utf8"
    );
    const vercelConfig = JSON.parse(
      await readFile(path.join(repoRoot, "client/vercel.json"), "utf8")
    );
    const css = await readFile(
      path.join(repoRoot, "client/src/App.css"),
      "utf8"
    );

    assert.match(appSource, /path="\/components\/:id"/);
    assert.equal(vercelConfig.rewrites[0].destination, "/index.html");
    assert.match(css, /70mm/);
    assert.match(css, /40mm/);
    assert.match(css, /detail-page/);
    assert.match(css, /max-width: 860px/);
  });
});
