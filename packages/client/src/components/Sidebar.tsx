import type { Conversation } from "@chat-x/shared";
import { NewChat } from "./NewChat.js";
import { ConversationList } from "./ConversationList.js";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: (username: string) => Promise<void>;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <NewChat onStart={onNewChat} />
      <ConversationList
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={onSelectConversation}
      />
    </aside>
  );
}
