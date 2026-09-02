import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  addConnection,
  updateUserPresence,
  removeConnection,
  writeMessageEvent,
  getUserPresences,
} from "../services/sse.service.js";
import { Conversation, SSE_EVENT_NAMES } from "@chat-x/shared";
import { getMessagesSince } from "../services/message.service.js";
import { getUserConversations } from "../services/conversation.service.js";

const router = Router();

// SSE endpoint for client to subscribe to SSE events.
router.get("/", async (req, res) => {
  //Auth is via query param because the native EventSource API does
  //not support custom headers.
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

  const conversations: Conversation[] = await getUserConversations(userId);
  const otherUserIds = new Set<string>();
  for (const convo of conversations) {
    for (const p of convo.participants) {
      otherUserIds.add(p.id);
    }
  }

  // Sending the presences of other users in the conversations ${userId} is in.
  const otherUserPresences = getUserPresences(Array.from(otherUserIds));
  const presenceData = JSON.stringify(otherUserPresences);
  res.write(`event: ${SSE_EVENT_NAMES.PRESENCE}\ndata: ${presenceData}\n\n`);

  // Update the presence of ${userId} to online
  await updateUserPresence(userId, true);

  req.on("close", () => {
    removeConnection(userId, sessionId);
    updateUserPresence(userId, false);
  });
});

export { router as eventsRouter };
