import { useState, useEffect, useCallback } from "react";
import type { Conversation, Message } from "@chat-x/shared";
import { getConversations, createConversation } from "../api/client.js";
import { useSSE } from "../hooks/useSSE.js";
import { useMessages } from "../hooks/useMessages.js";
import { Sidebar } from "../components/Sidebar.js";
import { ChatWindow } from "../components/ChatWindow.js";

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const { messages, hasMore, loadMore, addMessage, send } = useMessages(activeConversationId);

  useEffect(() => {
    getConversations().then((data) => setConversations(data.conversations));
  }, []);

  useSSE({
    onMessage: useCallback((message: Message) => {
      addMessage(message);

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === message.conversationId);
        if (!exists) {
          getConversations().then((data) => setConversations(data.conversations));
          return prev;
        }
        const updated = prev.map((c) =>
          c.id === message.conversationId
            ? { ...c, lastMessage: message, updatedAt: message.createdAt }
            : c,
        );
        updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        return updated;
      });
    }, [addMessage]),
  });

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
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onSend={send}
          />
        ) : (
          <div className="chat-placeholder">Select a conversation to start chatting</div>
        )}
      </div>
    </div>
  );
}
