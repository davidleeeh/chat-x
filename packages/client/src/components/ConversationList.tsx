import type { Conversation } from "@chat-x/shared";
import { useAuth } from "../hooks/useAuth.js";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  const { user } = useAuth();

  return (
    <div className="conversation-list">
      {conversations.length === 0 && (
        <p className="conversation-list-empty">No conversations yet</p>
      )}
      {conversations.map((conv) => {
        const otherUser = conv.participants.find((p) => p.id !== user?.id);
        const displayName = otherUser?.username ?? "Unknown";
        const isActive = conv.id === activeId;

        return (
          <div
            key={conv.id}
            className={`conversation-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(conv.id)}
          >
            <div className="conversation-item-name">{displayName}</div>
            <div className="conversation-item-preview">
              {conv.lastMessage ? conv.lastMessage.content : "No messages yet"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
