import { beforeEach, afterAll } from "vitest";
import { prisma } from "../lib/prisma.js";

beforeEach(async () => {
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
