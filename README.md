# Chat-X

A real-time 1-to-1 messaging web app. Two users can log in from separate browsers, start a conversation, and exchange messages that appear instantly on both sides.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Backend | Node.js, Express 5, TypeScript |
| Database | SQLite, Prisma ORM |
| Real-time | Server-Sent Events (SSE) |
| Deployment | Docker, single-container |

## Project Structure

```
packages/
├── shared/    # Types, constants, and validation shared between client and server
├── server/    # Express API, SSE connection management, Prisma data access
└── client/    # React SPA with Vite
```

Organized as a monorepo with npm workspaces. A shared package holds types, validation, and constants used by both client and server, so changes to the API contract are caught by the compiler at build time rather than at runtime. Keeping everything in one repository also simplifies Docker builds and dependency management.

## Usage

### Docker (recommended)

```bash
docker compose up --build
```

Open http://localhost:3000 in two browser windows, log in as different users, and start chatting.

### Local Development

```bash
npm install
npx prisma db push --schema=packages/server/prisma/schema.prisma
npm run dev
```

The server runs on port 3000 and the Vite dev server runs on port 5173 with API proxying.

### Tests

```bash
npm test
```

Integration tests run against a real SQLite database using Vitest and Supertest.

## Features

| Feature | Description |
|---------|-------------|
| Login | Enter a username to log in. A new account is created automatically if the username doesn't exist. |
| Start a conversation | Type another user's username and click Chat to start a 1-to-1 conversation. |
| Send and receive messages | Messages appear in real-time on both sides without refreshing the page. |
| Message history | Scroll up to load older messages. Full history is preserved across sessions. |
| Multi-tab support | Open the app in multiple tabs. Messages stay in sync across all of them. |
| Offline messages | If the other user is not online, messages are stored and visible when they log in next. |
| Reconnection recovery | If the connection drops, the app automatically reconnects and catches up on any missed messages. |

## Assumptions

1. This is a 1-to-1 chat application. Group chat is not supported.
2. Users are identified by username only. There is no password authentication, as the focus is on the messaging architecture rather than auth complexity.
3. A user starts a conversation by entering an exact username. There is no friend list, user search, or contact directory.
4. Messages are text-only, and cannot be edited or deleted once sent.
5. There are no typing indicators or read receipts.
6. The app is designed for a single-server deployment. Multi-instance scaling is out of scope for the MVP.
7. The app runs entirely locally in Docker with no external services or SaaS dependencies.

## Architecture and Key Decisions

| Decision | Reason |
|----------|--------|
| POST for sending, SSE for receiving | Separates the write path (stateless HTTP) from the read path (persistent event stream). The write side is simple to test and reason about. SSE provides automatic reconnection and missed-message recovery via the native `EventSource` API, so no manual reconnection logic is needed. |
| SQLite | Runs in-process with zero configuration, making Docker setup trivial (single container, no separate database service). Prisma ORM means switching to PostgreSQL is a one-line config change. |
| In-memory connection registry | Maps `userId -> sessionId -> connection`, supporting multiple tabs per user. Sufficient for single-instance deployment; would be replaced with Redis pub/sub for multi-instance scaling. |
| Username-only auth | Deliberately scoped out of the MVP so time went into the messaging path. Session ID serves as the bearer token with no separate token field. |
| Monorepo with shared package | Types, validation, and constants are shared between client and server. API contract changes are caught at compile time. Single repo simplifies Docker builds and dependency management. |
| Integration tests over unit tests | Tests hit a real SQLite database via HTTP with Supertest, catching issues that mocked tests would miss (e.g. Prisma query behavior, middleware chaining, response shapes). |

## Future Improvements

| Feature | Description |
|---------|-------------|
| Password authentication | Secure login with bcrypt hashing and JWT tokens |
| Typing indicators | Show when the other user is actively typing |
| Read receipts | Track which messages each user has read |
| Online/offline presence | Show whether a user is currently connected |
| Message editing and deletion | Allow users to modify or remove sent messages |
| File and image sharing | Send media attachments in conversations |
| Group chat | Support conversations with more than two participants |
| Full-text search | Search through message history |
| Rate limiting | Protect against spam and abuse |
| Multi-instance scaling | Redis pub/sub for SSE fanout, PostgreSQL for the database |
