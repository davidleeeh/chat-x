import type { Response } from "express";
import { SSE_HEARTBEAT_INTERVAL_MS, SSE_EVENT_NAMES } from "@chat-x/shared";
import type { Message, UserPresence } from "@chat-x/shared";
import { getUserConversations } from "./conversation.service";

interface SSEConnection {
  res: Response;
  heartbeat: NodeJS.Timeout;
}

// Outer map: userId → all connections for that user (for message fan-out to a recipient)
// Inner map: sessionId → connection (one user can have multiple tabs/devices)
//
// In-memory only: works for a single server instance. Multi-instance would require
// a pub/sub layer (e.g. Redis) to broadcast events across servers.
const connections = new Map<string, Map<string, SSEConnection>>();

export function addConnection(userId: string, sessionId: string, res: Response): void {
  if (!connections.has(userId)) {
    connections.set(userId, new Map());
  }

  // SSE comment lines (starting with `:`) are silently ignored by EventSource
  // but keep the TCP connection alive through proxies that drop idle connections.
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, SSE_HEARTBEAT_INTERVAL_MS);

  connections.get(userId)!.set(sessionId, { res, heartbeat });
}

export function removeConnection(userId: string, sessionId: string): void {
  const userConns = connections.get(userId);
  if (!userConns) return;

  const conn = userConns.get(sessionId);
  if (conn) {
    clearInterval(conn.heartbeat);
    userConns.delete(sessionId);
  }

  if (userConns.size === 0) {
    connections.delete(userId);
  }
}

export function getUserConnections(userId: string): Response[] {
  const userConns = connections.get(userId);
  if (!userConns) return [];
  return Array.from(userConns.values()).map((c) => c.res);
}

export function writeMessageEvent(res: Response, message: Message): void {
  res.write(
    `id: ${message.sequenceNum}\nevent: ${SSE_EVENT_NAMES.MESSAGE}\ndata: ${JSON.stringify(message)}\n\n`,
  );
}

export function broadcastMessage(userIds: string[], message: Message): void {
  for (const userId of userIds) {
    for (const res of getUserConnections(userId)) {
      writeMessageEvent(res, message);
    }
  }
}

export function broadcastTyping(
  recipientIds: string[],
  userId: string,
  conversationId: string,
  isTyping: boolean,
) {
  for (const recipientId of recipientIds) {
    for (const res of getUserConnections(recipientId)) {
      const userTypingData = JSON.stringify({ userId, conversationId, isTyping });
      res.write(`event: ${SSE_EVENT_NAMES.TYPING}\ndata: ${userTypingData}\n\n`);
    }
  }
}

export async function getUserPresences(userIds: string[]): Promise<UserPresence[]> {
  const userPresences = new Map<string, UserPresence>();

  return userIds.map((uid) => {
    const isOnline = getUserConnections(uid).length > 0;
    return { userId: uid, isOnline };
  });
}

export async function updateUserPresence(userId: string, isOnline: boolean) {
  const myPresnceData = JSON.stringify({ userId, isOnline });
  const conversations = await getUserConversations(userId);

  for (const convo of conversations) {
    const participants = convo.participants.filter((p) => p.id !== userId);
    for (const p of participants) {
      for (const conn of getUserConnections(p.id)) {
        conn.write(`event: ${SSE_EVENT_NAMES.PRESENCE}\ndata: ${myPresnceData}\n\n`);
      }
    }
  }
}
