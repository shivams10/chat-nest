# chat-nest-sdk

> Frontend SDK for Chat Nest providing a simple React hook to consume streaming AI APIs safely using Server-Side Events (SSE).

This package handles:
- Server-Side Events (SSE) streaming response handling
- Real-time token streaming via SSE protocol
- Cancellation propagation
- Intelligent retry behavior
- Error normalization
- Message state management

Designed for production usage in React applications. Uses SSE for efficient, bidirectional communication with the backend.

---

## ✨ Features

- Server-Side Events (SSE) streaming protocol
- Real-time token streaming via SSE events
- Abort-safe cancellation
- Retry only on network / server failures
- No retries on client or policy errors
- Message state management
- Lightweight and framework-friendly
- Efficient SSE event parsing (`token`, `done`, `error`, `ping`, `start` events)

---

## 📦 Installation

```bash
npm install chat-nest-sdk
```

---

## 🚀 Usage

### Example

```
import { useAiChat } from "chat-nest-sdk";

function App() {
  const chat = useAiChat({
    endpoint: "http://localhost:3001/api/chat",
    initialProfile: "balanced",
    dailyTokenLimit: 50_000,    // optional: cap daily tokens
    maxTokensPerRequest: 4096,  // optional: cap per request
  });

  return (
    <>
      <div>
        {chat.messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role}</strong>: {m.content}
          </div>
        ))}
      </div>

      <button onClick={() => chat.sendMessage("Hello!")}>
        Send
      </button>

      <button onClick={chat.cancel}>
        Cancel
      </button>
      <select value={chat.profile} onChange={(e) => chat.setProfile(e.target.value)}>
        <option value="constrained">Constrained</option>
        <option value="balanced">Balanced</option>
        <option value="expanded">Expanded</option>
      </select>
    </>
  );
}
```

---

## 🧠 API

### useAiChat(options)

| Field               | Type   | Description                                                                 |
| ------------------- | ------ | --------------------------------------------------------------------------- |
| endpoint            | string | Backend API endpoint                                                        |
| initialMessages     | Message[] | Optional. Initial messages                                              |
| maxMessages         | number | Optional. Max messages to keep in context (default 10)                      |
| initialProfile      | AiUsageProfile | Optional. Profile: `constrained`, `balanced`, `expanded`              |
| dailyTokenLimit     | number | Optional. Cap daily tokens; server applies min(profile limit, this)        |
| maxTokensPerRequest | number | Optional. Cap tokens per request (input + output); server applies min      |

### Return value

| Field             | Description                   |
| ----------------- | ----------------------------- |
| messages          | Chat message list             |
| sendMessage(text) | Sends user message            |
| cancel()          | Cancels active request        |
| isStreaming       | Whether stream is active      |
| error             | Last error                    |
| profile           | Current profile               |
| setProfile(p)     | Set profile; persisted to localStorage |
| reset()           | Reset messages and error      |

---

## ⚠️ Important Notes

Only one active request is allowed at a time.

Cancel immediately stops streaming and billing.

4xx errors are never retried.

Network failures retry automatically.

**Server-Side Events (SSE)**: The SDK communicates with the backend using the SSE protocol. The backend must send events in SSE format (`event: <type>\ndata: <data>\n\n`). Supported event types: `start`, `token`, `done`, `error`, `ping`.

---

## 📄 License

ISC