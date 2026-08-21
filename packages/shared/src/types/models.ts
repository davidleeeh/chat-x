export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface Message {
  id: string;
  sequenceNum: number;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  lastMessage: Message | null;
  updatedAt: string;
}

export interface TypingUpdate {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}
