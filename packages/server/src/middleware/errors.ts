import type { Request, Response, NextFunction } from "express";
import { createLogger } from "@chat-x/shared";

const logger = createLogger("server");

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  logger.error(err);
  res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
}
