# chat-nest-sdk

> Frontend SDK for Chat Nest providing a simple React hook to consume streaming AI APIs safely.

This package handles:
- Streaming response handling
- Cancellation propagation
- Intelligent retry behavior
- Error normalization
- Message state management

Designed for production usage in React applications.

---

## ✨ Features

- Streaming token handling
- Abort-safe cancellation
- Retry only on network / server failures
- No retries on client or policy errors
- Message state management
- Lightweight and framework-friendly

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
    </>
  );
}
```

---

## 🧠 API

### useAiChat(options)

| Field    | Type   | Description          |
| -------- | ------ | -------------------- |
| endpoint | string | Backend API endpoint |

| Field             | Description              |
| ----------------- | ------------------------ |
| messages          | Chat message list        |
| sendMessage(text) | Sends user message       |
| cancel()          | Cancels active request   |
| isStreaming       | Whether stream is active |
| error             | Last error               |

---

## ⚠️ Important Notes

Only one active request is allowed at a time.

Cancel immediately stops streaming and billing.

4xx errors are never retried.

Network failures retry automatically.

---

## 📄 License

ISC