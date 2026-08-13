import { useState, useEffect, useCallback } from "react";
import type { Conversation, Message } from "@chat-x/shared";
import { getMessages, sendMessage } from "../api/client.js";
import { useAuth } from "../hooks/useAuth.js";
import { MessageList } from "./MessageList.js";
import { MessageInput } from "./MessageInput.js";

interface ChatWindowProps {
  conversation: Conversation;
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Map<string, Message>>(new Map());
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setMessages(new Map());
    setHasMore(false);

    getMessages(conversation.id).then((data) => {
      const map = new Map<string, Message>();
      for (const msg of data.messages) {
        map.set(msg.id, msg);
      }
      setMessages(map);
      setHasMore(data.hasMore);
    });
  }, [conversation.id]);

  const handleLoadMore = useCallback(async () => {
    const sorted = Array.from(messages.values()).sort(
      (a, b) => a.sequenceNum - b.sequenceNum,
    );
    const oldest = sorted[0];
    if (!oldest) return;

    const data = await getMessages(conversation.id, oldest.sequenceNum);
    setMessages((prev) => {
      const next = new Map(prev);
      for (const msg of data.messages) {
        next.set(msg.id, msg);
      }
      return next;
    });
    setHasMore(data.hasMore);
  }, [conversation.id, messages]);

  const handleSend = useCallback(
    async (content: string) => {
      const data = await sendMessage(conversation.id, content);
      setMessages((prev) => {
        const next = new Map(prev);
        next.set(data.message.id, data.message);
        return next;
      });
    },
    [conversation.id],
  );

  const otherUser = conversation.participants.find((p) => p.id !== user?.id);
  const sortedMessages = Array.from(messages.values()).sort(
    (a, b) => a.sequenceNum - b.sequenceNum,
  );

  return (
    <>
      <div className="chat-header">
        <span>{otherUser?.username ?? "Unknown"}</span>
      </div>
      <MessageList
        messages={sortedMessages}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
      />
      <MessageInput onSend={handleSend} />
    </>
  );
}
