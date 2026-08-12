import { Router } from "express";
import { validateUsername } from "@chat-x/shared";
import { loginOrRegister, logout, getUserById } from "../services/auth.service.js";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { username } = req.body;

  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "Username is required", code: "VALIDATION_ERROR" });
    return;
  }

  const validationError = validateUsername(username.trim());
  if (validationError) {
    res.status(400).json({ error: validationError, code: "VALIDATION_ERROR" });
    return;
  }

  const result = await loginOrRegister(username.trim());
  res.json(result);
});

router.post("/logout", authMiddleware, async (req, res) => {
  const { sessionId } = req as AuthenticatedRequest;
  await logout(sessionId);
  res.json({ success: true });
});

router.get("/me", authMiddleware, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const user = await getUserById(userId);

  if (!user) {
    res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    return;
  }

  res.json({ user });
});

export { router as authRouter };
