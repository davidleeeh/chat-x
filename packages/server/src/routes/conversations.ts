import { Router } from "express";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth.js";
import {
  findExistingConversation,
  createConversation,
  getUserConversations,
} from "../services/conversation.service.js";
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
    res.status(400).json({ error: "Cannot start a conversation with yourself", code: "VALIDATION_ERROR" });
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

export { router as conversationsRouter };
