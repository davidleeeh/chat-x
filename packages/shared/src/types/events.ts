import type { Message } from "./models.js";

export interface SSEMessageEvent {
  type: "message";
  data: Message;
}

export interface SSEConnectedEvent {
  type: "connected";
  data: { userId: string };
}

export type SSEEvent = SSEMessageEvent | SSEConnectedEvent;
