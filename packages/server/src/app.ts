import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { conversationsRouter } from "./routes/conversations.js";
import { eventsRouter } from "./routes/events.js";
import { errorHandler } from "./middleware/errors.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/events", eventsRouter);

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });

  app.use(errorHandler);

  return app;
}
