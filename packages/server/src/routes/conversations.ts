import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  findExistingConversation,
  createConversation,
  getUserConversations,
} from "../services/conversation.service.js";
import { sendMessage, getMessages } from "../services/message.service.js";
import { broadcastMessage, broadcastTyping } from "../services/sse.service.js";
import { validateMessageContent } from "@chat-x/shared";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const conversations = await getUserConversations(userId);
  res.json({ conversations });
});

// Idempotent: returns the existing conversation if one already exists between the
// two users, so the client can call this without checking first.
router.post("/", async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { participantUsername } = req.body;

  if (!participantUsername || typeof participantUsername !== "string") {
    res.status(400).json({ error: "participantUsername is required", code: "VALIDATION_ERROR" });
    return;
  }

  const otherUser = await prisma.user.findUnique({
    where: { username: participantUsername.trim() },
  });

  if (!otherUser) {
    res.status(404).json({ error: "User not found", code: "USER_NOT_FOUND" });
    return;
  }

  if (otherUser.id === userId) {
    res
      .status(400)
      .json({ error: "Cannot start a conversation with yourself", code: "VALIDATION_ERROR" });
    return;
  }

  const existing = await findExistingConversation(userId, otherUser.id);
  if (existing) {
    res.json({ conversation: existing });
    return;
  }

  const conversation = await createConversation(userId, otherUser.id);
  res.status(201).json({ conversation });
});

router.get("/:conversationId/messages", async (req, res) => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const { conversationId } = req.params;

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (!participant) {
    res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
    return;
  }

  const before = req.query.before ? Number(req.query.before) : undefined;
  if (before !== undefined && (isNaN(before) || before < 1)) {
    res.status(400).json({ error: "Invalid 'before' cursor", code: "VALIDATION_ERROR" });
    return;
  }

  const result = await getMessages(conversationId, before);
  res.json(result);
});

router.post("/:conversationId/messages", async (req, res) => {
  const userId = (req as unknown as AuthenticatedRequest).userId;
  const { conversationId } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== "string") {
    res.status(400).json({ error: "content is required", code: "VALIDATION_ERROR" });
    return;
  }

  const validationError = validateMessageContent(content);
  if (validationError) {
    res.status(400).json({ error: validationError, code: "VALIDATION_ERROR" });
    return;
  }

  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (!participant) {
    res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
    return;
  }

  const message = await sendMessage(conversationId, userId, content.trim());

  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });

  // This will broadcast the message to all participants in this conversation, including the sender.
  broadcastMessage(
    participants.map((p) => p.userId),
    message,
  );

  res.status(201).json({ message });
});

router.post("/:conversationId/typing", async (req, res) => {
  const { userId } = req as unknown as AuthenticatedRequest;
  const { conversationId } = req.params;
  const { isTyping } = req.body;

  const sender = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });

  if (!sender) {
    res.status(404).json({ error: "Conversation not found", code: "NOT_FOUND" });
    return;
  }

  const otherParticipants = await prisma.conversationParticipant.findMany({
    where: {
      conversationId,
      userId: { not: userId },
    },
  });

  const recipientIds = otherParticipants.map((p: { userId: string }): string => p.userId);

  broadcastTyping(recipientIds, userId, conversationId, isTyping);

  res.json({ success: true });
});

export { router as conversationsRouter };
