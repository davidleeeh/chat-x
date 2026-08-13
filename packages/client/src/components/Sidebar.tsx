import type { Conversation } from "@chat-x/shared";
import { NewChat } from "./NewChat.js";
import { ConversationList } from "./ConversationList.js";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  error: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: (username: string) => Promise<void>;
  onDismissError: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  error,
  onSelectConversation,
  onNewChat,
  onDismissError,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <NewChat onStart={onNewChat} />
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={onDismissError}>Dismiss</button>
        </div>
      )}
      <ConversationList
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={onSelectConversation}
      />
    </aside>
  );
}
