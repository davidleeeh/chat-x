import { useState, useEffect, useCallback } from "react";
import type { Message } from "@chat-x/shared";
import { getMessages, sendMessage } from "../api/client.js";

// Deduplicates by message ID before inserting. The sender receives their own
// message twice: once from the POST response and once via SSE (which also
// syncs their other tabs). The ID check ensures no duplicates in the UI.
function insertSorted(messages: Message[], message: Message): Message[] {
  if (messages.some((m) => m.id === message.id)) return messages;
  const next = [...messages, message];
  next.sort((a, b) => a.sequenceNum - b.sequenceNum);
  return next;
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages([]);
    setHasMore(false);
    setError(null);

    if (!conversationId) return;

    setLoading(true);
    getMessages(conversationId).then((data) => {
      setMessages(data.messages);
      setHasMore(data.hasMore);
    }).catch(() => {
      setError("Failed to load messages");
    }).finally(() => {
      setLoading(false);
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

    try {
      const data = await getMessages(conversationId, oldest.sequenceNum);
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const newMsgs = data.messages.filter((m) => !seen.has(m.id));
        return [...newMsgs, ...prev];
      });
      setHasMore(data.hasMore);
    } catch {
      setError("Failed to load older messages");
    }
  }, [conversationId, messages]);

  const send = useCallback(
    async (content: string) => {
      if (!conversationId) return;
      try {
        setError(null);
        const data = await sendMessage(conversationId, content);
        addMessage(data.message);
      } catch {
        setError("Failed to send message");
      }
    },
    [conversationId, addMessage],
  );

  const clearError = useCallback(() => setError(null), []);

  return { messages, hasMore, loading, error, loadMore, addMessage, send, clearError };
}
