import type { User, Message, Conversation } from './models.js';

export interface LoginRequest {
  username: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface MeResponse {
  user: User;
}

export interface CreateConversationRequest {
  participantUsername: string;
}

export interface CreateConversationResponse {
  conversation: Conversation;
}

export interface GetConversationsResponse {
  conversations: Conversation[];
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface SendMessageResponse {
  message: Message;
}

export interface GetMessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  code: string;
}
