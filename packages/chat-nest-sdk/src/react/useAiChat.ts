import { useCallback, useMemo, useRef, useState } from "react";

import {
  MessageRole,
  type AiUsageProfile,
  type Message,
  type UseAIChatOptions,
  type UseAIChatReturn,
} from "chat-nest-core";
import { FetchAiClient } from "../core/aiClient.js";
import { generateId } from "../core/utils/helpers.js";

const STORAGE_KEY = "aiUsageProfile";

const VALID_PROFILES: AiUsageProfile[] = ["constrained", "balanced", "expanded"];

const DEFAULT_PROFILE: AiUsageProfile = "balanced";

function readStoredProfile(): AiUsageProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID_PROFILES.includes(raw as AiUsageProfile)) {
      return raw as AiUsageProfile;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PROFILE;
}

export function useAiChat(options: UseAIChatOptions): UseAIChatReturn {
  const {
    endpoint,
    initialMessages = [],
    maxMessages = 10,
    initialProfile,
    dailyTokenLimit,
    maxTokensPerRequest,
  } = options;

  const [profile, setProfileState] = useState<AiUsageProfile>(
    () => initialProfile ?? readStoredProfile()
  );

  const setProfile = useCallback((next: AiUsageProfile) => {
    setProfileState(next);
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const [messages, setMessages] = useState<Message[]>(initialMessages);
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
      await clientRef.current!.streamChat(
        history,
        {
          onToken(token: string) {
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
          onError(err: Error) {
            setError(err.message);
            setIsStreaming(false);
          },
        },
        profile,
        dailyTokenLimit != null || maxTokensPerRequest != null
          ? { dailyTokenLimit: dailyTokenLimit ?? undefined, maxTokensPerRequest: maxTokensPerRequest ?? undefined }
          : undefined
      );
    } catch (err) {
      setError((err as Error).message);
      setIsStreaming(false);
    }
  }, [
    endpoint,
    isStreaming,
    maxMessages,
    messages,
    profile,
    dailyTokenLimit,
    maxTokensPerRequest,
  ]);

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
      profile,
      setProfile,
    }),
    [messages, sendMessage, cancel, reset, isStreaming, error, profile, setProfile]
  );
}
