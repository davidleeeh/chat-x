import { useState, useEffect, useCallback } from "react";
import type { Message } from "@chat-x/shared";
import { getMessages, sendMessage } from "../api/client.js";

function insertSorted(messages: Message[], message: Message): Message[] {
  if (messages.some((m) => m.id === message.id)) return messages;
  const next = [...messages, message];
  next.sort((a, b) => a.sequenceNum - b.sequenceNum);
  return next;
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setMessages([]);
    setHasMore(false);

    if (!conversationId) return;

    getMessages(conversationId).then((data) => {
      setMessages(data.messages);
      setHasMore(data.hasMore);
    });
  }, [conversationId]);

  const addMessage = useCallback(
    (message: Message) => {
      if (message.conversationId !== conversationId) return;
      setMessages((prev) => insertSorted(prev, message));
    },
    [conversationId],
  );

  const loadMore = useCallback(async () => {
    if (!conversationId) return;

    const oldest = messages[0];
    if (!oldest) return;

    const data = await getMessages(conversationId, oldest.sequenceNum);
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const newMsgs = data.messages.filter((m) => !seen.has(m.id));
      return [...newMsgs, ...prev];
    });
    setHasMore(data.hasMore);
  }, [conversationId, messages]);

  const send = useCallback(
    async (content: string) => {
      if (!conversationId) return;
      const data = await sendMessage(conversationId, content);
      addMessage(data.message);
    },
    [conversationId, addMessage],
  );

  return { messages, hasMore, loadMore, addMessage, send };
}
