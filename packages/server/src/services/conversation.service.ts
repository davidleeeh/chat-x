import { prisma } from "../lib/prisma.js";
import type { Conversation, User } from "@chat-x/shared";

interface DbConversation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    user: {
      id: string;
      username: string;
      createdAt: Date;
    };
  }[];
  messages: {
    id: string;
    sequenceNum: number;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    sender: {
      username: string;
    };
  }[];
}

function toConversationResponse(conv: DbConversation): Conversation {
  const participants: User[] = conv.participants.map((p) => ({
    id: p.user.id,
    username: p.user.username,
    createdAt: p.user.createdAt.toISOString(),
  }));

  const lastMsg = conv.messages[0] ?? null;
  const lastMessage = lastMsg
    ? {
        id: lastMsg.id,
        sequenceNum: lastMsg.sequenceNum,
        conversationId: lastMsg.conversationId,
        senderId: lastMsg.senderId,
        senderUsername: lastMsg.sender.username,
        content: lastMsg.content,
        createdAt: lastMsg.createdAt.toISOString(),
      }
    : null;

  return {
    id: conv.id,
    participants,
    lastMessage,
    updatedAt: conv.updatedAt.toISOString(),
  };
}

const conversationInclude = {
  participants: {
    include: { user: true },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: { sender: true },
  },
};

export async function findExistingConversation(
  userIdA: string,
  userIdB: string,
): Promise<Conversation | null> {
  // Find a conversation where both users are participants
  // TODO: This is based on the assumption of 1-1 conversations. How do we make it support group chat?
  const conv = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: userIdA } } },
        { participants: { some: { userId: userIdB } } },
      ],
    },
    include: conversationInclude,
  });

  return conv ? toConversationResponse(conv) : null;
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const convs = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } },
    },
    include: conversationInclude,
    orderBy: { updatedAt: "desc" },
  });

  return convs.map(toConversationResponse);
}

export async function createConversation(userIdA: string, userIdB: string): Promise<Conversation> {
  const conv = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: userIdA }, { userId: userIdB }],
      },
    },
    include: conversationInclude,
  });

  return toConversationResponse(conv);
}
