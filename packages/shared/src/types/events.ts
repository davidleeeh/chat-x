import type { Message } from "./models.js";

export interface SSEMessageEvent {
  type: "message";
  data: Message;
}

export interface SSEConnectedEvent {
  type: "connected";
  data: { userId: string };
}

export interface SSETypingEvent {
  type: "typing";
  data: { userId: string; conversationId: string; isTyping: boolean };
}

export interface SSEPresenceEvent {
  type: "presence";
  data: { userId: string; isOnline: boolean };
}

export type SSEEvent = SSEMessageEvent | SSEConnectedEvent | SSETypingEvent | SSEPresenceEvent;
