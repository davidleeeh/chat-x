import type { Conversation } from "@chat-x/shared";
import { useAuth } from "../hooks/useAuth.js";
import { usePresence } from "../hooks/usePresence.js";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  const { user } = useAuth();
  const { presences } = usePresence();

  return (
    <div className="conversation-list">
      {conversations.length === 0 && (
        <p className="conversation-list-empty">No conversations yet</p>
      )}
      {conversations.map((conv) => {
        const otherUser = conv.participants.find((p) => p.id !== user?.id);
        const displayName = otherUser?.username ?? "Unknown";
        const isActive = conv.id === activeId;
        const isOnline = otherUser ? presences[otherUser.id]?.isOnline : false;

        return (
          <div
            key={conv.id}
            className={`conversation-item ${isActive ? "active" : ""}`}
            onClick={() => onSelect(conv.id)}
          >
            <div className="conversation-item-name">
              <span className={`presence-dot ${isOnline ? "online" : ""}`} />
              {displayName}
            </div>
            <div className="conversation-item-preview">
              {conv.lastMessage ? conv.lastMessage.content : "No messages yet"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
