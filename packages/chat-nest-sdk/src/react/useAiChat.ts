import { useCallback, useMemo, useRef, useState } from "react";

import {
    MessageRole,
  type Message,
  type UseAIChatOptions,
  type UseAIChatReturn,
} from "chat-nest-core";
import { FetchAiClient } from "../core/aiClient.js";
import { generateId } from "../core/utils/helpers.js";

export function useAiChat(
  options: UseAIChatOptions
): UseAIChatReturn {
  const {
    endpoint,
    initialMessages = [],
    maxMessages = 10,
  } = options;

  const [messages, setMessages] = useState<Message[]>(
    initialMessages
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>();

  const clientRef = useRef<FetchAiClient | null>(null);

  if (!clientRef.current) {
    clientRef.current = new FetchAiClient({
      endpoint,
    });
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    setError(undefined);

    const userMessage: Message = {
      id: generateId(),
      role: MessageRole.User,
      content: text,
    };

    const assistantMessage: Message = {
      id: generateId(),
      role: MessageRole.Assistant,
      content: "",
    };

    setMessages((prev) => {
      const next = [...prev, userMessage, assistantMessage];
      return next.slice(-maxMessages);
    });

    setIsStreaming(true);

    const history = [...messages, userMessage];

    try {
      await clientRef.current!.streamChat(history, {
        onToken(token) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? {
                    ...msg,
                    content: msg.content + token,
                  }
                : msg
            )
          );
        },
        onComplete() {
          setIsStreaming(false);
        },
        onError(err) {
          setError(err.message);
          setIsStreaming(false);
        },
      });
    } catch (err) {
      setError((err as Error).message);
      setIsStreaming(false);
    }
  }, [endpoint, isStreaming, maxMessages, messages]);

  const cancel = useCallback(() => {
    clientRef.current?.cancel();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setMessages(initialMessages);
    setError(undefined);
  }, [cancel, initialMessages]);

  return useMemo(
    () => ({
      messages,
      sendMessage,
      cancel,
      reset,
      isStreaming,
      error,
    }),
    [messages, sendMessage, cancel, reset, isStreaming, error]
  );
}
