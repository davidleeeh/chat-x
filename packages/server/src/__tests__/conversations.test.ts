import { describe, it, expect } from "vitest";
import request from "supertest";
import "./setup.js";
import { createApp } from "../app.js";

const app = createApp();

async function login(username: string) {
  const res = await request(app).post("/api/auth/login").send({ username });
  return res.body.token as string;
}

async function createConversation(token: string, participantUsername: string) {
  const res = await request(app)
    .post("/api/conversations")
    .set("Authorization", `Bearer ${token}`)
    .send({ participantUsername });
  return res;
}

describe("POST /api/conversations", () => {
  it("creates a new conversation", async () => {
    const aliceToken = await login("alice");
    await login("bob");

    const res = await createConversation(aliceToken, "bob");

    expect(res.status).toBe(201);
    expect(res.body.conversation.participants).toHaveLength(2);
    expect(res.body.conversation.lastMessage).toBeNull();
  });

  it("returns existing conversation on duplicate request", async () => {
    const aliceToken = await login("alice");
    await login("bob");

    const first = await createConversation(aliceToken, "bob");
    const second = await createConversation(aliceToken, "bob");

    expect(second.status).toBe(200);
    expect(second.body.conversation.id).toBe(first.body.conversation.id);
  });

  it("returns 404 for non-existent participant", async () => {
    const aliceToken = await login("alice");

    const res = await createConversation(aliceToken, "nobody");

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("USER_NOT_FOUND");
  });

  it("returns 400 for self-conversation", async () => {
    const aliceToken = await login("alice");

    const res = await createConversation(aliceToken, "alice");

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/conversations", () => {
  it("returns the user's conversations sorted by recent activity", async () => {
    const aliceToken = await login("alice");
    await login("bob");
    await login("charlie");

    const conv1 = await createConversation(aliceToken, "bob");
    await createConversation(aliceToken, "charlie");

    // Send a message in conv1 to make it more recent
    await request(app)
      .post(`/api/conversations/${conv1.body.conversation.id}/messages`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ content: "Hello bob" });

    const res = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.conversations).toHaveLength(2);
    expect(res.body.conversations[0].id).toBe(conv1.body.conversation.id);
  });

  it("returns empty array for user with no conversations", async () => {
    const aliceToken = await login("alice");

    const res = await request(app)
      .get("/api/conversations")
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.conversations).toEqual([]);
  });
});

describe("POST /api/conversations/:conversationId/messages", () => {
  it("sends a message and returns it", async () => {
    const aliceToken = await login("alice");
    await login("bob");
    const conv = await createConversation(aliceToken, "bob");
    const convId = conv.body.conversation.id;

    const res = await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ content: "Hello!" });

    expect(res.status).toBe(201);
    expect(res.body.message.content).toBe("Hello!");
    expect(res.body.message.senderUsername).toBe("alice");
    expect(res.body.message.sequenceNum).toBe(1);
    expect(res.body.message.conversationId).toBe(convId);
  });

  it("returns 404 when sender is not a participant", async () => {
    const aliceToken = await login("alice");
    await login("bob");
    const charlieToken = await login("charlie");
    const conv = await createConversation(aliceToken, "bob");

    const res = await request(app)
      .post(`/api/conversations/${conv.body.conversation.id}/messages`)
      .set("Authorization", `Bearer ${charlieToken}`)
      .send({ content: "Sneaky!" });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });

  it("returns 400 for empty content", async () => {
    const aliceToken = await login("alice");
    await login("bob");
    const conv = await createConversation(aliceToken, "bob");

    const res = await request(app)
      .post(`/api/conversations/${conv.body.conversation.id}/messages`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ content: "   " });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("GET /api/conversations/:conversationId/messages", () => {
  it("returns messages in ascending order", async () => {
    const aliceToken = await login("alice");
    const bobToken = await login("bob");
    const conv = await createConversation(aliceToken, "bob");
    const convId = conv.body.conversation.id;

    await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ content: "Hello" });
    await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set("Authorization", `Bearer ${bobToken}`)
      .send({ content: "Hi back" });

    const res = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(2);
    expect(res.body.messages[0].content).toBe("Hello");
    expect(res.body.messages[1].content).toBe("Hi back");
    expect(res.body.hasMore).toBe(false);
  });

  it("supports cursor-based pagination with 'before' param", async () => {
    const aliceToken = await login("alice");
    await login("bob");
    const conv = await createConversation(aliceToken, "bob");
    const convId = conv.body.conversation.id;

    await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ content: "First" });
    await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ content: "Second" });
    await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set("Authorization", `Bearer ${aliceToken}`)
      .send({ content: "Third" });

    const res = await request(app)
      .get(`/api/conversations/${convId}/messages?before=3`)
      .set("Authorization", `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(2);
    expect(res.body.messages[0].content).toBe("First");
    expect(res.body.messages[1].content).toBe("Second");
  });

  it("returns 404 when requester is not a participant", async () => {
    const aliceToken = await login("alice");
    await login("bob");
    const charlieToken = await login("charlie");
    const conv = await createConversation(aliceToken, "bob");

    const res = await request(app)
      .get(`/api/conversations/${conv.body.conversation.id}/messages`)
      .set("Authorization", `Bearer ${charlieToken}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
