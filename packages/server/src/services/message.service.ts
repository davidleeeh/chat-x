import { prisma } from "../lib/prisma.js";
import type { Message } from "@chat-x/shared";
import { MESSAGES_PER_PAGE } from "@chat-x/shared";

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<Message> {
  const lastMessage = await prisma.message.findFirst({
    orderBy: { sequenceNum: "desc" },
    select: { sequenceNum: true },
  });
  const sequenceNum = (lastMessage?.sequenceNum ?? 0) + 1;

  const [msg] = await prisma.$transaction([
    prisma.message.create({
      data: { sequenceNum, conversationId, senderId, content },
      include: { sender: true },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return toMessageResponse(msg);
}

interface DbMessage {
  id: string;
  sequenceNum: number;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: { username: string };
}

function toMessageResponse(msg: DbMessage): Message {
  return {
    id: msg.id,
    sequenceNum: msg.sequenceNum,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderUsername: msg.sender.username,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  };
}

export async function getMessagesSince(
  userId: string,
  afterSequenceNum: number,
): Promise<Message[]> {
  const messages = await prisma.message.findMany({
    where: {
      sequenceNum: { gt: afterSequenceNum },
      conversation: { participants: { some: { userId } } },
    },
    include: { sender: true },
    orderBy: { sequenceNum: "asc" },
    take: 500,
  });

  return messages.map(toMessageResponse);
}

export async function getMessages(
  conversationId: string,
  before?: number,
): Promise<{ messages: Message[]; hasMore: boolean }> {
  const where: { conversationId: string; sequenceNum?: { lt: number } } = { conversationId };
  if (before !== undefined) {
    where.sequenceNum = { lt: before };
  }

  const messages = await prisma.message.findMany({
    where,
    include: { sender: true },
    orderBy: { sequenceNum: "desc" },
    // Fetch one extra row beyond the page size. If it exists, there are more pages;
    // pop it off before returning. This avoids a separate COUNT query.
    take: MESSAGES_PER_PAGE + 1,
  });

  const hasMore = messages.length > MESSAGES_PER_PAGE;
  if (hasMore) messages.pop();

  return {
    messages: messages.reverse().map(toMessageResponse),
    hasMore,
  };
}
