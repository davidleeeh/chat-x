import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  findExistingConversation,
  createConversation,
  getUserConversations,
} from "../services/conversation.service.js";
import { sendMessage } from "../services/message.service.js";
import { validateMessageContent } from "@chat-x/shared";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const conversations = await getUserConversations(userId);
  res.json({ conversations });
});

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

router.post("/:conversationId/messages", async (req, res) => {
  //TODO: Find alternatives to fix this type workaround
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
  res.status(201).json({ message });
});

export { router as conversationsRouter };
