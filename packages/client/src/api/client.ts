import type {
  LoginResponse,
  MeResponse,
  CreateConversationResponse,
  GetConversationsResponse,
  SendMessageResponse,
  GetMessagesResponse,
  ApiError,
  SetTypingResponse,
} from "@chat-x/shared";

const TOKEN_KEY = "chat-x-token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });

  if (!res.ok) {
    const body = (await res.json()) as ApiError;
    throw new Error(body.error);
  }

  return res.json() as Promise<T>;
}

export async function login(username: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
  setStoredToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  await request("/api/auth/logout", { method: "POST" });
  clearStoredToken();
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/api/auth/me");
}

export async function getConversations(): Promise<GetConversationsResponse> {
  return request<GetConversationsResponse>("/api/conversations");
}

export async function createConversation(
  participantUsername: string,
): Promise<CreateConversationResponse> {
  return request<CreateConversationResponse>("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ participantUsername }),
  });
}

export async function getMessages(
  conversationId: string,
  before?: number,
): Promise<GetMessagesResponse> {
  const params = before ? `?before=${before}` : "";
  return request<GetMessagesResponse>(`/api/conversations/${conversationId}/messages${params}`);
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<SendMessageResponse> {
  return request<SendMessageResponse>(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function sendTypingEvent(
  conversationId: string,
  isTyping: boolean,
): Promise<SetTypingResponse> {
  return request<SetTypingResponse>(`/api/conversations/${conversationId}/typing`, {
    method: "POST",
    body: JSON.stringify({ isTyping }),
  });
}
