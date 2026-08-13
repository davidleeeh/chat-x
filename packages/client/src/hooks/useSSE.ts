import { useEffect, useEffectEvent } from "react";
import type { Message } from "@chat-x/shared";
import { SSE_EVENT_NAMES } from "@chat-x/shared";
import { getStoredToken } from "../api/client.js";

interface UseSSEOptions {
  onMessage: (message: Message) => void;
}

export function useSSE({ onMessage }: UseSSEOptions) {
  const handleMessage = useEffectEvent((message: Message) => {
    onMessage(message);
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    const es = new EventSource(`/api/events?token=${token}`);

    es.addEventListener(SSE_EVENT_NAMES.MESSAGE, (event) => {
      const message = JSON.parse(event.data) as Message;
      handleMessage(message);
    });

    return () => es.close();
  }, []);
}
