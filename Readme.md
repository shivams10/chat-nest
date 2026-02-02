![License](https://img.shields.io/badge/license-ISC-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![npm](https://img.shields.io/npm/v/chat-nest-sdk)

# Chat Nest

> A production-ready AI chat platform providing a reusable frontend SDK, streaming backend server, and built-in cost protections.

Chat Nest is designed for teams who want to integrate AI chat experiences quickly without sacrificing reliability, cancellation safety, or cost control.

---

## ✨ Features

- Server-Side Events (SSE) for streaming AI responses
- Real-time token streaming via SSE protocol
- End-to-end cancellation propagation
- Intelligent retry handling
- Daily budget enforcement
- Rate limiting
- Message trimming to prevent prompt bloat
- Reusable frontend SDK
- Monorepo architecture with shared contracts
- Demo application included

---

## 🏛 Architecture Overview

```
apps/
  demo/                  → React demo app

packages/
  chat-nest-core/        → Shared types and contracts
  chat-nest-sdk/         → Frontend SDK (React hook + client)
  chat-nest-server/      → Express streaming API server
```

---

## Data Flow

UI (React)
   ↓
chat-nest-sdk (SSE client)
   ↓
chat-nest-server (SSE streaming)
   ↓
OpenAI API

**Communication**: All streaming communication uses Server-Side Events (SSE) protocol for efficient real-time token delivery.

---

## 🚀 Quick Start

1. Install dependencies

```
npm install
```

2. Configure environment

Create the file: apps/demo/.env
Add: OPENAI_API_KEY=your_api_key_here

3. Build packages

From repository root:

```
npm run build:core
npm run build:sdk
npm run build:server
```

4. Start backend server

```
npx tsx apps/demo/server.ts
```

5. Start frontend demo

```
cd apps/demo
npm run dev
```

---

## 📦 SDK Usage Example

```
import { useAiChat } from "chat-nest-sdk";

const chat = useAiChat({
  endpoint: "http://localhost:3001/api/chat",
  initialProfile: "balanced",
  dailyTokenLimit: 50_000,   // optional cap
  maxTokensPerRequest: 4096, // optional cap
});

chat.sendMessage("Hello AI");
chat.cancel();
chat.profile;    // current profile
chat.setProfile("expanded");
```

---

## 💰 Cost Controls

Chat Nest includes built-in safety mechanisms:

- **Maximum tokens per request** – Profile-based and client-overridable
- **Daily token budget enforcement** – Per profile, client can cap lower
- **Rate limiting** – Per profile
- **Intelligent retry handling** – No retries on policy/client errors
- **Abort-safe streaming cancellation** – Stops billing immediately

These guardrails prevent unexpected API costs and runaway usage.

### Customizable profiles (SDK + server)

Three usage profiles control limits: `constrained`, `balanced`, `expanded`. The SDK and server support:

- **Profile selection** – `aiUsageProfile` / `profile` sent with each request
- **dailyTokenLimit** – Client can cap daily tokens (server applies `min(profile limit, client value)`)
- **maxTokensPerRequest** – Client can cap per-request tokens (input + output)

See [chat-nest-sdk](packages/chat-nest-sdk/README.md) and [chat-nest-server](packages/chat-nest-server/README.md) for options.

---

## 🧪 Development Commands

```
npm run build:core
npm run build:sdk
npm run build:server
npm run lint
```

---

## 📄 License

ISC

---

## 📦 Packages

This monorepo contains the following published npm packages:

### 🧩 chat-nest-core
Shared types and contracts used across the platform.

- npm: https://www.npmjs.com/package/chat-nest-core
- source: https://github.com/shivams10/chat-nest/tree/main/packages/chat-nest-core

---

### ⚛️ chat-nest-sdk
Frontend React SDK for consuming streaming AI APIs with cancellation and retry safety.

- npm: https://www.npmjs.com/package/chat-nest-sdk
- source: https://github.com/shivams10/chat-nest/tree/main/packages/chat-nest-sdk

---

### 🖥 chat-nest-server
Streaming AI backend server with cost controls, rate limiting, and cancellation support.

- npm: https://www.npmjs.com/package/chat-nest-server
- source: https://github.com/shivams10/chat-nest/tree/main/packages/chat-nest-server
