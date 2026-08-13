import { useState, useEffect, useCallback } from "react";
import type { Conversation } from "@chat-x/shared";
import { getConversations, createConversation } from "../api/client.js";
import { Sidebar } from "../components/Sidebar.js";
import { ChatWindow } from "../components/ChatWindow.js";

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    getConversations().then((data) => setConversations(data.conversations));
  }, []);

  const handleNewChat = useCallback(async (username: string) => {
    const data = await createConversation(username);
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === data.conversation.id);
      if (exists) return prev;
      return [data.conversation, ...prev];
    });
    setActiveConversationId(data.conversation.id);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  return (
    <div className="chat-page">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewChat={handleNewChat}
      />
      <div className="chat-area">
        {activeConversation ? (
          <ChatWindow conversation={activeConversation} />
        ) : (
          <div className="chat-placeholder">Select a conversation to start chatting</div>
        )}
      </div>
    </div>
  );
}
