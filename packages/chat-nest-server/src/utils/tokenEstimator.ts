import type { Message } from "chat-nest-core";

// Rough estimate: ~4 characters per token
export function estimateTokens(messages: Message[]) {
  const text = messages.map((m) => m.content).join(" ");
  return Math.ceil(text.length / 4);
}
