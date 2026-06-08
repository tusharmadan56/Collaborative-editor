# Real-Time Collaborative Code Editor Backend

A production-grade backend system where multiple users join "rooms" and collaboratively edit code in real-time, with live cursors, presence tracking, OT-based conflict resolution, and session persistence.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│                   (Browser / IDE / Mobile App)                    │
└─────────────────┬────────────────────────┬───────────────────────┘
                  │  REST API (HTTP)        │  WebSocket (Socket.io)
                  │                        │
┌─────────────────▼────────────────────────▼───────────────────────┐
│                     Node.js + Express Server                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────────┐ │
│  │   Auth Module    │  │  Rooms Module   │  │ Documents Module │ │
│  │  (JWT + bcrypt)  │  │  (CRUD + Join)  │  │  (Get + Save)   │ │
│  └─────────────────┘  └─────────────────┘  └──────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │               Socket.io WebSocket Layer                       ││
│  │  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────────┐  ││
│  │  │Room Handler│ │Editor (OT) │ │ Cursor   │ │ Presence   │  ││
│  │  │join/leave  │ │text-delta  │ │ position │ │ online/off │  ││
│  │  └────────────┘ └────────────┘ └──────────┘ └────────────┘  ││
│  └──────────────────────────────────────────────────────────────┘│
│  ┌──────────────────┐  ┌──────────────────────────────────────┐  │
│  │  Middleware       │  │  Utilities                           │  │
│  │  • JWT Auth       │  │  • OT Engine (transform/apply)      │  │
│  │  • Rate Limiting  │  │  • Winston Logger                   │  │
│  └──────────────────┘  └──────────────────────────────────────┘  │
└──────────┬──────────────────┬───────────────────┬────────────────┘
           │                  │                   │
     ┌─────▼─────┐     ┌─────▼─────┐      ┌──────▼──────┐
     │ PostgreSQL │     │   Redis   │      │   BullMQ    │
     │            │     │           │      │             │
     │ • users    │     │ • pub/sub │      │ persist-    │
     │ • rooms    │     │   (scale) │      │ queue       │
     │ • members  │     │ • doc     │      │             │
     │ • documents│     │   cache   │      │ Async save  │
     │ • history  │     │ • presence│      │ to Postgres │
     └───────────┘     └───────────┘      └─────────────┘
```

## Tech Stack

| Technology        | Purpose                              |
|-------------------|--------------------------------------|
| Node.js + Express | REST API framework                   |
| Socket.io         | WebSocket real-time communication    |
| PostgreSQL        | Persistent storage (users, docs)     |
| Redis             | Pub/sub, caching, presence tracking  |
| BullMQ            | Job queue for async persistence      |
| JWT + bcryptjs    | Authentication & password hashing    |
| Zod               | Input validation                     |
| Winston           | Structured logging                   |
| Docker Compose    | Local development environment        |

## Project Structure

```
src/
├── config/
│   ├── db.js               # PostgreSQL connection pool
│   └── redis.js             # Redis clients (cmd, pub, sub)
├── middleware/
│   ├── auth.js              # JWT verification middleware
│   └── rateLimit.js         # Express rate limiters
├── modules/
│   ├── auth/
│   │   ├── auth.routes.js
│   │   ├── auth.controller.js
│   │   ├── auth.schema.js   # Zod schemas
│   │   └── auth.service.js
│   ├── rooms/
│   │   ├── rooms.routes.js
│   │   ├── rooms.controller.js
│   │   ├── rooms.schema.js  # Zod schemas
│   │   └── rooms.service.js
│   └── documents/
│       ├── documents.routes.js
│       ├── documents.controller.js
│       ├── documents.schema.js  # Zod schemas
│       └── documents.service.js
├── sockets/
│   ├── index.js             # Socket.io server init + Redis pub/sub
│   ├── roomHandler.js       # join/leave room logic
│   ├── editorHandler.js     # text delta + OT broadcasting
│   ├── cursorHandler.js     # cursor position relay
│   └── presenceHandler.js   # online/offline presence (Redis sets)
├── queues/
│   ├── index.js             # BullMQ queue setup
│   └── persistWorker.js     # Async document save worker
├── utils/
│   ├── ot.js                # Operational Transformation engine
│   └── logger.js            # Winston logger
├── app.js                   # Express app setup
└── server.js                # Entry point
```

## Setup Instructions

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- Node.js 18+ (for local development without Docker)

### Quick Start (Docker)

```bash
# 1. Clone the repository
git clone <repo-url>
cd collab-editor-backend

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up --build

# The server will be running at http://localhost:3000
```

### Local Development (without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Make sure PostgreSQL and Redis are running locally

# 3. Set up the database
psql -U user -d collab_editor -f migrations/init.sql

# 4. Copy and configure .env
cp .env.example .env
# Edit .env with your local database/redis URLs

# 5. Start the dev server
npm run dev
```

## REST API Endpoints

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response 201:
{
  "message": "User registered successfully",
  "user": { "id": "uuid", "email": "user@example.com", "created_at": "..." },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response 200:
{
  "message": "Login successful",
  "user": { "id": "uuid", "email": "user@example.com", "created_at": "..." },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Rooms

#### Create Room
```
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "My Project" }

Response 201:
{
  "message": "Room created successfully",
  "room": { "id": "uuid", "name": "My Project", "owner_id": "uuid", "created_at": "..." }
}
```

#### Get Room Details
```
GET /api/rooms/:id

Response 200:
{
  "room": { "id": "uuid", "name": "My Project", "owner_id": "uuid", "member_count": "3" }
}
```

#### Join Room
```
POST /api/rooms/:id/join
Authorization: Bearer <token>

Response 200:
{ "message": "Joined room successfully" }
```

#### Get Room History
```
GET /api/rooms/:id/history
Authorization: Bearer <token>

Response 200:
{
  "history": [
    { "id": "uuid", "delta": {...}, "user_id": "uuid", "email": "...", "timestamp": "..." }
  ]
}
```

### Documents

#### Get Document
```
GET /api/documents/:roomId
Authorization: Bearer <token>

Response 200:
{
  "document": { "content": "function hello() {...}", "version": 42 }
}
```

#### Save Snapshot
```
POST /api/documents/:roomId/save
Authorization: Bearer <token>

Response 200:
{
  "message": "Document snapshot saved",
  "document": { "content": "...", "version": 42 }
}
```

### Health Check
```
GET /health

Response 200:
{ "status": "ok", "timestamp": "...", "uptime": 123.45 }
```

## WebSocket Events

### Client → Server

| Event          | Payload                                          | Description                  |
|----------------|--------------------------------------------------|------------------------------|
| `join-room`    | `{ roomId: string, token: string }`              | Authenticate and join a room |
| `leave-room`   | `{ roomId: string }`                             | Leave a room                 |
| `text-delta`   | `{ roomId, delta: Operation, version: number }`  | Send a text operation        |
| `cursor-move`  | `{ roomId, position: { line, ch }, userId }`     | Update cursor position       |

### Server → Client

| Event              | Payload                                              | Description                        |
|--------------------|------------------------------------------------------|------------------------------------|
| `room-joined`      | `{ users: User[], document: { content, version } }`  | Room state on successful join      |
| `user-joined`      | `{ userId: string, email: string }`                   | Another user joined the room       |
| `user-left`        | `{ userId: string }`                                  | A user left the room               |
| `text-delta`       | `{ delta: Operation, version: number, userId }`       | Broadcast text operation           |
| `cursor-update`    | `{ userId, email, position: { line, ch } }`           | Broadcast cursor position          |
| `version-conflict` | `{ serverVersion: number, clientVersion: number }`    | Version mismatch detected          |
| `auth-error`       | `{ message: string }`                                 | Authentication failed              |

## How OT Conflict Resolution Works

Operational Transformation (OT) is the algorithm that makes real-time collaborative editing possible. Here's how it works in this system:

### The Problem
When two users edit the same document simultaneously, their operations are based on the same document version. If we just apply them sequentially, the second operation may corrupt the document because positions have shifted.

**Example:**
- Document: `"Hello"`
- User A inserts `"X"` at position 1 → `"HXello"` (version 0 → 1)
- User B deletes 1 char at position 3 → `"Helo"` (version 0 → 1)

If we apply B's operation to A's result without transformation, we'd delete the wrong character.

### The Solution: `transform(op1, op2)`
The `transform` function takes two concurrent operations and adjusts the second one so it can be correctly applied after the first:

1. **Insert vs Insert**: If op2's position is at or after op1's, shift op2 right by the length of op1's inserted text.
2. **Insert vs Delete**: If op2 (delete) starts at or after op1's insert, shift op2 right by the inserted text length.
3. **Delete vs Insert**: If op2 (insert) is at or after the deleted region, shift op2 left by the deletion length.
4. **Delete vs Delete**: Handle overlapping ranges — reduce op2's length by the overlap, adjust position.

### Server Flow
```
1. Client sends text-delta { delta, version: N }
2. Server checks: does version N match server's current version?
   → NO:  Emit "version-conflict" — client must rebase
   → YES: Apply delta, increment version, broadcast to room
3. All other clients receive the transformed delta and apply it
```

### Three Operation Types
```javascript
{ type: 'insert', position: 5, text: 'hello' }  // Insert text at position
{ type: 'delete', position: 3, length: 4 }       // Delete 4 chars from position
{ type: 'retain', length: 10 }                    // Skip/keep 10 chars (no-op)
```

## How Redis Pub/Sub Enables Horizontal Scaling

### The Problem
When running multiple Node.js instances behind a load balancer, Socket.io connections are distributed across instances. If User A is connected to Instance 1 and User B to Instance 2, a regular `socket.to(room).emit()` on Instance 1 won't reach User B.

### The Solution: Redis Pub/Sub

```
 Instance 1                    Instance 2
┌──────────────┐              ┌──────────────┐
│ User A edits │              │ User B waits │
│ text-delta   │              │              │
│      │       │              │              │
│      ▼       │              │              │
│ Apply to     │              │              │
│ Redis doc    │              │              │
│      │       │              │              │
│      ▼       │              │       │      │
│ PUBLISH to   │──── Redis ───│──▶ SUBSCRIBE │
│ room:{id}    │   Channel    │  room:{id}   │
│              │              │       │      │
│              │              │       ▼      │
│              │              │ Broadcast to │
│              │              │ local clients│
└──────────────┘              └──────────────┘
```

1. **On delta received**: The instance applies the delta locally and publishes the event to Redis channel `room:{roomId}`
2. **All instances subscribe**: Every instance listens on room channels and broadcasts received events to their local Socket.io clients
3. **Document state in Redis**: The document content is stored in Redis (`doc:{roomId}`), so all instances share the same source of truth
4. **Presence in Redis Sets**: Online users are tracked in Redis sets (`presence:{roomId}`), accessible from any instance

This architecture allows you to scale horizontally simply by adding more Node.js instances behind a load balancer — no sticky sessions required.

## Rate Limiting

| Transport  | Limit                    | Action on Exceed        |
|------------|--------------------------|-------------------------|
| REST API   | 100 req / 15 min per IP  | 429 Too Many Requests   |
| Auth API   | 20 req / 15 min per IP   | 429 Too Many Requests   |
| WebSocket  | 50 deltas / sec / socket | Socket disconnected     |

## Environment Variables

| Variable       | Default                                            | Description            |
|----------------|----------------------------------------------------|------------------------|
| `PORT`         | `3000`                                             | Server port            |
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/collab_editor` | PostgreSQL connection  |
| `REDIS_URL`    | `redis://localhost:6379`                           | Redis connection       |
| `JWT_SECRET`   | (required)                                         | JWT signing secret     |
| `JWT_EXPIRES_IN`| `7d`                                              | JWT expiration         |
| `NODE_ENV`     | `development`                                      | Environment mode       |
| `CORS_ORIGIN`  | `*`                                                | CORS allowed origins   |

## License

MIT
