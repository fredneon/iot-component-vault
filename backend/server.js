import "dotenv/config";
import { createApp } from "./app.js";
import connectDB from "./config/db.js";

const app = createApp();
const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (error) => {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  });

  try {
    await connectDB();
  } catch (error) {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
  }
};

startServer();
