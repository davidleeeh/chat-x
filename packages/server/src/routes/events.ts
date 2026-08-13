import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { addConnection, removeConnection, writeMessageEvent } from "../services/sse.service.js";
import { SSE_EVENT_NAMES } from "@chat-x/shared";
import { getMessagesSince } from "../services/message.service.js";

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

  const lastEventId = req.headers["last-event-id"];
  if (lastEventId) {
    const afterSequenceNum = Number(lastEventId);
    if (!isNaN(afterSequenceNum)) {
      const missed = await getMessagesSince(userId, afterSequenceNum);
      for (const msg of missed) {
        writeMessageEvent(res, msg);
      }
    }
  }

  req.on("close", () => {
    removeConnection(userId, sessionId);
  });
});

export { router as eventsRouter };
