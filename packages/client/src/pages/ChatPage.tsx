import { useState, useEffect, useCallback, useEffectEvent } from "react";
import type { Conversation, Message, TypingUpdate, User, UserPresence } from "@chat-x/shared";
import { getConversations, createConversation, sendTypingEvent } from "../api/client.js";
import { useSSE } from "../hooks/useSSE.js";
import { useMessages } from "../hooks/useMessages.js";
import { Sidebar } from "../components/Sidebar.js";
import { ChatWindow } from "../components/ChatWindow.js";
import { usePresence } from "../hooks/usePresence.js";
import { useAuth } from "../hooks/useAuth.js";

export function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const { setPresence, presences } = usePresence();

  const {
    messages,
    hasMore,
    loading: loadingMessages,
    error,
    loadMore,
    addMessage,
    send,
    clearError,
  } = useMessages(activeConversationId);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const syncUserNames = useEffectEvent((conversations: Conversation[]) => {
    for (const convo of conversations) {
      for (const user of convo.participants) {
        setPresence({
          userId: user.id,
          userName: user.username,
        });
      }
    }
  });

  useEffect(() => {
    async function loadConversations() {
      try {
        const data = await getConversations();
        setConversations(data.conversations);
        syncUserNames(data.conversations);
      } catch {
        setConversationsError("Failed to load conversations");
      } finally {
        setLoadingConversations(false);
      }
    }

    loadConversations();
  }, []);

  const handleIncomingMessage = useCallback(
    (message: Message) => {
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
    },
    [addMessage],
  );

  const handleIncomingTypingUpdate = useCallback(
    ({ conversationId, userId, isTyping }: TypingUpdate): void => {
      if (!conversationId || conversationId !== activeConversationId) {
        return;
      }

      setTypingUsers((prev) => {
        const next = new Map(prev);

        const existingTimeout = prev.get(userId);

        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        if (isTyping) {
          const newTimeout = setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev);
              const current = next.get(userId);
              if (current) {
                next.delete(userId);
              }

              return next;
            });
          }, 5000);
          next.set(userId, newTimeout);
        } else {
          next.delete(userId);
        }

        return next;
      });
    },
    [activeConversationId],
  );

  const handleIncomingPresenceUpdates = useCallback(
    (updates: UserPresence[]) => {
      for (const { userId, isOnline } of updates) {
        setPresence({ userId, isOnline });
      }
    },
    [setPresence],
  );

  useSSE({
    onMessage: handleIncomingMessage,
    onTypingChange: handleIncomingTypingUpdate,
    onPresenceChange: handleIncomingPresenceUpdates,
  });

  const handleConversationChange = (conversationId: string) => {
    setActiveConversationId(conversationId);

    for (const timeout of typingUsers.values()) {
      clearTimeout(timeout);
    }

    setTypingUsers(new Map());
  };

  const handleTypingChange = useCallback(
    async (isTyping: boolean): Promise<void> => {
      if (!activeConversationId) {
        return;
      }

      await sendTypingEvent(activeConversationId, isTyping);
    },
    [activeConversationId],
  );

  const handleNewChat = useCallback(async (username: string) => {
    const data = await createConversation(username);
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === data.conversation.id);
      if (exists) return prev;
      return [data.conversation, ...prev];
    });

    handleConversationChange(data.conversation.id);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  return (
    <div className="chat-page">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        loading={loadingConversations}
        error={conversationsError}
        onSelectConversation={handleConversationChange}
        onNewChat={handleNewChat}
        onDismissError={() => setConversationsError(null)}
      />
      <div className="chat-area">
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            hasMore={hasMore}
            loading={loadingMessages}
            error={error}
            typingUsers={Array.from(typingUsers.keys())}
            onLoadMore={loadMore}
            onSend={send}
            onTypingChange={handleTypingChange}
            onDismissError={clearError}
          />
        ) : (
          <div className="chat-placeholder">Select a conversation to start chatting</div>
        )}
      </div>
    </div>
  );
}
