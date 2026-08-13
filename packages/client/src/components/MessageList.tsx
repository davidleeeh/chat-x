import { useEffect, useRef } from "react";
import type { Message } from "@chat-x/shared";
import { useAuth } from "../hooks/useAuth.js";

interface MessageListProps {
  messages: Message[];
  hasMore: boolean;
  onLoadMore: () => void;
}

export function MessageList({ messages, hasMore, onLoadMore }: MessageListProps) {
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);

  useEffect(() => {
    if (wasAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 30;

    if (el.scrollTop === 0 && hasMore) {
      onLoadMore();
    }
  };

  return (
    <div className="message-list" ref={containerRef} onScroll={handleScroll}>
      {hasMore && (
        <button className="load-more" onClick={onLoadMore}>
          Load older messages
        </button>
      )}
      {messages.map((msg) => {
        const isMine = msg.senderId === user?.id;
        return (
          <div key={msg.id} className={`message ${isMine ? "mine" : "theirs"}`}>
            {!isMine && <div className="message-sender">{msg.senderUsername}</div>}
            <div className="message-content">{msg.content}</div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
