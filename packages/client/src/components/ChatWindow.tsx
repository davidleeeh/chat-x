import type { Conversation, Message } from "@chat-x/shared";
import { useAuth } from "../hooks/useAuth.js";
import { MessageList } from "./MessageList.js";
import { MessageInput } from "./MessageInput.js";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  typingUsers: string[];
  onLoadMore: () => void;
  onSend: (content: string) => Promise<void>;
  onTypingChange: (isTyping: boolean) => Promise<void>;
  onDismissError: () => void;
}

export function ChatWindow({
  conversation,
  messages,
  hasMore,
  loading,
  error,
  typingUsers,
  onLoadMore,
  onSend,
  onTypingChange,
  onDismissError,
}: ChatWindowProps) {
  const { user } = useAuth();
  const otherUser = conversation.participants.find((p) => p.id !== user?.id);
  const isOtherUserTyping = typingUsers.includes(otherUser?.id ?? "");
  const typingIndicator = isOtherUserTyping ? `${otherUser?.username} is typing...` : null;

  return (
    <>
      <div className="chat-header">
        <span>{otherUser?.username ?? "Unknown"}</span>
      </div>
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={onDismissError}>Dismiss</button>
        </div>
      )}
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner" />
        </div>
      )}
      <MessageList
        messages={messages}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        typingIndicator={typingIndicator}
      />
      <MessageInput onSend={onSend} onTypingChange={onTypingChange} />
    </>
  );
}
