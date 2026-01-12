![License](https://img.shields.io/badge/license-ISC-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)
![Node](https://img.shields.io/badge/node-18%2B-green)
![npm](https://img.shields.io/npm/v/chat-nest-sdk)

# Chat Nest

> A production-ready AI chat platform providing a reusable frontend SDK, streaming backend server, and built-in cost protections.

Chat Nest is designed for teams who want to integrate AI chat experiences quickly without sacrificing reliability, cancellation safety, or cost control.

---

## ✨ Features

- Streaming AI responses
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
chat-nest-sdk
   ↓
chat-nest-server
   ↓
OpenAI API

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
});

chat.sendMessage("Hello AI");
chat.cancel();
```

---

## 💰 Cost Controls

```
Chat Nest includes built-in safety mechanisms:

Maximum tokens per request

Daily token budget enforcement

Rate limiting

Intelligent retry handling

Abort-safe streaming cancellation

These guardrails prevent unexpected API costs and runaway usage.
```

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