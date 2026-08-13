// Shared constants used by both client and server.
// Validation limits are enforced on both sides: client-side for UX,
// server-side as the authoritative check.

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
export const MESSAGE_MAX_LENGTH = 2000;
// Fetch one extra row to determine if more pages exist, avoiding a separate COUNT query.
export const MESSAGES_PER_PAGE = 50;
// Keeps connections alive through proxies/load balancers that drop idle connections.
export const SSE_HEARTBEAT_INTERVAL_MS = 30_000;

export const SSE_EVENT_NAMES = {
  MESSAGE: "message",
  CONNECTED: "connected",
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  CONVERSATION_EXISTS: "CONVERSATION_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
} as const;
