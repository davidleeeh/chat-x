import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { addConnection, removeConnection } from "../services/sse.service.js";
import { SSE_EVENT_NAMES } from "@chat-x/shared";

const router = Router();

router.get("/", async (req, res) => {
  const token = req.query.token as string | undefined;

  if (!token) {
    res.status(401).json({ error: "Missing token", code: "UNAUTHORIZED" });
    return;
  }

  const session = await prisma.session.findUnique({ where: { id: token } });
  if (!session) {
    res.status(401).json({ error: "Invalid token", code: "UNAUTHORIZED" });
    return;
  }

  const userId = session.userId;
  const sessionId = session.id;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  addConnection(userId, sessionId, res);

  const connectedData = JSON.stringify({ userId });
  res.write(`event: ${SSE_EVENT_NAMES.CONNECTED}\ndata: ${connectedData}\n\n`);

  req.on("close", () => {
    removeConnection(userId, sessionId);
  });
});

export { router as eventsRouter };
