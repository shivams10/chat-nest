# chat-nest-server

> Streaming AI backend server for Chat Nest with built-in cost protection and cancellation propagation.

This package exposes an Express-compatible request handler that:
- Streams AI responses
- Enforces rate limits and budgets
- Supports abort propagation
- Protects against runaway usage

---

## ✨ Features

- Streaming responses over HTTP
- End-to-end cancellation support
- Daily token budget enforcement
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

---

## 🔐 Environment Variables

| Variable       | Description    |
| -------------- | -------------- |
| OPENAI_API_KEY | OpenAI API key |

## 💰 Cost Controls

```
The server enforces:

Maximum tokens per request

Daily token budget

Request rate limiting

Prompt size trimming

Retry classification

This prevents accidental overspending and abuse.
```

---

## ⚙ Configuration
Limits can be customized in:

src/config/
  aiLimits.ts
  budget.ts

---

## 📄 License

ISC