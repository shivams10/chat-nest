import { useState } from "react";
import { useAiChat } from "chat-nest-sdk";

export default function App() {
  const [input, setInput] = useState("");

  const chat = useAiChat({
    endpoint: "http://localhost:3001/api/chat", // or "/api/chat" if using proxy
  });

  function handleSend() {
    if (!input.trim()) return;
    chat.sendMessage(input);
    setInput("");
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Chat Nest Demo</h2>

      <div style={{ border: "1px solid #ccc", padding: 12, minHeight: 120 }}>
        {chat.messages.map((m) => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ width: 300, marginRight: 8 }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={chat.isStreaming}
        >
          Send
        </button>

        <button
          type="button"
          onClick={chat.cancel}
          disabled={!chat.isStreaming}
          style={{ marginLeft: 8 }}
        >
          Cancel
        </button>
      </div>

      {chat.error && (
        <div style={{ color: "red", marginTop: 8 }}>
          {chat.error}
        </div>
      )}
    </div>
  );
}
