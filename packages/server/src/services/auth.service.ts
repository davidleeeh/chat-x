import { prisma } from "../lib/prisma.js";
import type { User } from "@chat-x/shared";

function toUserResponse(user: { id: string; username: string; createdAt: Date }): User {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function loginOrRegister(username: string): Promise<{ user: User; token: string }> {
  let user = await prisma.user.findUnique({ where: { username } });

  if (!user) {
    user = await prisma.user.create({ data: { username } });
  }

  const session = await prisma.session.create({
    data: { userId: user.id },
  });

  return {
    user: toUserResponse(user),
    token: session.id,
  };
}

export async function logout(sessionId: string): Promise<void> {
  await prisma.session.delete({ where: { id: sessionId } });
}

export async function getUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user ? toUserResponse(user) : null;
}
