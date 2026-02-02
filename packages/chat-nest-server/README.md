# chat-nest-server

> Streaming AI backend server for Chat Nest with built-in cost protection and cancellation propagation using Server-Side Events (SSE).

This package exposes an Express-compatible request handler that:
- Streams AI responses using Server-Side Events (SSE)
- Sends real-time tokens via SSE protocol
- Enforces rate limits and profile-based limits
- Supports abort propagation
- Protects against runaway usage

---

## ✨ Features

- Server-Side Events (SSE) streaming over HTTP
- Real-time token streaming via SSE protocol
- SSE event types: `start`, `token`, `done`, `error`, `ping`
- Heartbeat pings to keep connection alive
- End-to-end cancellation support
- Daily token limit enforcement (profile-based)
- Rate limiting
- Message trimming
- Safe retry semantics
- OpenAI adapter included

---

## 📦 Installation

```bash
npm install chat-nest-server
```

## 🚀 Usage
Express Integration

The handler automatically uses Server-Side Events (SSE) for streaming responses:

```
import express from "express";
import cors from "cors";
import { createChatHandler } from "chat-nest-server";

const app = express();

app.use(cors());
app.use(express.json());

app.post(
  "/api/chat",
  createChatHandler({
    apiKey: process.env.OPENAI_API_KEY!,
  })
);

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});
```

The handler sends SSE-formatted events:
- `event: start\ndata: \n\n` - Stream started
- `event: token\ndata: <token>\n\n` - Each token chunk
- `event: done\ndata: \n\n` - Stream completed
- `event: error\ndata: <error_json>\n\n` - Error occurred
- `event: ping\ndata: \n\n` - Heartbeat (every 15s)

---

## 🔐 Environment Variables

| Variable       | Description    |
| -------------- | -------------- |
| OPENAI_API_KEY | OpenAI API key |

## 💰 Cost Controls

Profiles (`constrained`, `balanced`, `expanded`) control limits. HARD_CAPS clamp all profiles. Server enforces:

- **Maximum tokens per request** – Profile-based; client can override via `maxTokensPerRequest` (server applies `min(profile limit, client value)`)
- **Daily token limit** – Profile-based; client can override via `dailyTokenLimit` (same `min` rule)
- Request rate limiting (profile)
- Prompt size trimming (profile)
- Retry classification

### Request body options

| Field               | Type   | Description                                                                 |
| ------------------- | ------ | --------------------------------------------------------------------------- |
| `messages`          | array  | Chat messages (required)                                                    |
| `profile` / `aiUsageProfile` | string | Profile: `constrained`, `balanced`, `expanded` (legacy: `budget`, `moderate`, `free`) |
| `dailyTokenLimit`   | number | Optional. Cap daily tokens; server uses `min(profile limit, this)`          |
| `maxTokensPerRequest` | number | Optional. Cap tokens per request; server uses `min(profile limit, this)`  |

This prevents accidental overspending and abuse.

## 🔄 Server-Side Events (SSE)

This package uses SSE protocol for efficient streaming:

- **Content-Type**: `text/event-stream`
- **Connection**: `keep-alive`
- **Cache-Control**: `no-cache`
- **Heartbeat**: Ping every 15 seconds to keep connection alive
- **Event Format**: `event: <type>\ndata: <data>\n\n`

SSE provides better efficiency and real-time streaming compared to traditional polling or chunked responses.

---

## ⚙ Configuration

- **`config/profiles.ts`** – AI usage profiles (`constrained`, `balanced`, `expanded`), HARD_CAPS, and `resolveProfile()`. Frontend may send `aiUsageProfile` string; backend resolves safely.
- **`config/aiLimits.ts`** – `AI_MODEL` only. All limits come from profiles.

---

## 📄 License

ISC