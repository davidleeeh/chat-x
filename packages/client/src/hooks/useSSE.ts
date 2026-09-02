import { useEffect, useEffectEvent } from "react";
import type { Message, TypingUpdate, UserPresence } from "@chat-x/shared";
import { SSE_EVENT_NAMES } from "@chat-x/shared";
import { getStoredToken } from "../api/client.js";

interface UseSSEOptions {
  onMessage: (message: Message) => void;
  onTypingChange: (typingData: TypingUpdate) => void;
  onPresenceChange: (updates: UserPresence[]) => void;
}

// Uses the native EventSource API (not @microsoft/fetch-event-source) for
// built-in auto-reconnection and Last-Event-ID recovery with zero manual
// reconnection logic.
//
// useEffectEvent (React 19.1) gives a stable callback reference that always
// sees the latest onMessage without re-running the effect or adding it as a
// dependency — the SSE connection stays open across re-renders.
export function useSSE({ onMessage, onTypingChange, onPresenceChange }: UseSSEOptions) {
  const handleMessage = useEffectEvent((message: Message) => {
    onMessage(message);
  });

  const handleTypingUpdate = useEffectEvent((update: TypingUpdate) => {
    onTypingChange(update);
  });

  const handlePresenceUpdate = useEffectEvent((updates: UserPresence[]) => {
    onPresenceChange(updates);
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const es = new EventSource(`/api/events?token=${token}`);

    es.addEventListener(SSE_EVENT_NAMES.MESSAGE, (event) => {
      const message = JSON.parse(event.data) as Message;
      handleMessage(message);
    });

    es.addEventListener(SSE_EVENT_NAMES.TYPING, (event) => {
      const typingUpdate = JSON.parse(event.data) as TypingUpdate;
      handleTypingUpdate(typingUpdate);
    });

    es.addEventListener(SSE_EVENT_NAMES.PRESENCE, (event) => {
      const presenceUpdates = JSON.parse(event.data) as UserPresence[];
      handlePresenceUpdate(presenceUpdates);
    });

    return () => es.close();
  }, []);
}
