import express from "express";
import cors from "cors";
import componentRoutes from "./routes/componentRoutes.js";

export const createApp = () => {
  const app = express();

  const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ].filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
    })
  );
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "IoT Dev Board & Component Vault API is running",
    });
  });

  app.use("/api/components", componentRoutes);

  app.use((req, res) => {
    res.status(404).json({
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  app.use((err, req, res, _next) => {
    if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
      return res.status(400).json({ message: "Invalid JSON body" });
    }

    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid component ID" });
    }

    if (err.name === "ValidationError") {
      const message = Object.values(err.errors)
        .map((item) => item.message)
        .join(". ");
      return res.status(400).json({ message });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      message: err.message || "Server error",
    });
  });

  return app;
};
