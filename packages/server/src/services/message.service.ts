import { prisma } from "../lib/prisma.js";
import type { Message } from "@chat-x/shared";

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string,
): Promise<Message> {
  //TODO: Consider optimizing how to get the last sequenceNum.
  // Also look into why sequenceNum is unique across all conversations.
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
