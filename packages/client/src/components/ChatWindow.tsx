import type { Conversation, Message } from "@chat-x/shared";
import { useAuth } from "../hooks/useAuth.js";
import { MessageList } from "./MessageList.js";
import { MessageInput } from "./MessageInput.js";

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  hasMore: boolean;
  onLoadMore: () => void;
  onSend: (content: string) => Promise<void>;
}

export function ChatWindow({ conversation, messages, hasMore, onLoadMore, onSend }: ChatWindowProps) {
  const { user } = useAuth();
  const otherUser = conversation.participants.find((p) => p.id !== user?.id);

  return (
    <>
      <div className="chat-header">
        <span>{otherUser?.username ?? "Unknown"}</span>
      </div>
      <MessageList
        messages={messages}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />
      <MessageInput onSend={onSend} />
    </>
  );
}
