import type { Message } from "chat-nest-core";
import type { Request, Response } from "express";
import OpenAI from "openai";

import { AI_LIMITS, AI_MODEL } from "./config/aiLimits.js";
import { BUDGET } from "./config/budget.js";
import { estimateTokens } from "./utils/tokenEstimator.js";
import {
  canSpendTokens,
  recordTokenUsage,
} from "./utils/tokenBudget.js";

export type ChatHandlerConfig = {
  apiKey: string;
};

let requestCount = 0;
let windowStart = Date.now();

function isRateLimited() {
  const now = Date.now();

  if (now - windowStart > AI_LIMITS.rateLimitWindowMs) {
    windowStart = now;
    requestCount = 0;
  }

  requestCount++;
  return requestCount > AI_LIMITS.maxRequestsPerWindow;
}

function trimMessages(messages: Message[]) {
  return messages.slice(-AI_LIMITS.maxMessages);
}

export function createChatHandler(config: ChatHandlerConfig) {
  if (!config.apiKey) {
    throw new Error("OPENAI_API_KEY is missing");
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
  });

  return async function handler(req: Request, res: Response) {
    const abortController = new AbortController();
    let streamStarted = false;

    // Abort upstream request only if client disconnects mid-stream
    res.on("close", () => {
      if (streamStarted && !abortController.signal.aborted) {
        abortController.abort();
      }
    });

    try {
      const body = req.body as { messages?: Message[] };

      if (!Array.isArray(body.messages)) {
        res.status(400).json({ error: "Invalid messages payload" });
        return;
      }

      if (isRateLimited()) {
        res.status(429).json({
          error: "Rate limit exceeded. Please slow down.",
        });
        return;
      }

      const trimmedMessages = trimMessages(body.messages);

      // Budget protection
      const estimatedInputTokens = estimateTokens(trimmedMessages);
      const estimatedTotalTokens =
        estimatedInputTokens + AI_LIMITS.maxOutputTokens;

      if (
        estimatedTotalTokens > BUDGET.maxTokensPerRequest ||
        !canSpendTokens(estimatedTotalTokens, BUDGET.dailyTokenLimit)
      ) {
        res.status(429).json({
          error: "Daily AI budget exceeded. Try again tomorrow.",
        });
        return;
      }

      // Streaming setup
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Transfer-Encoding", "chunked");

      const stream = await client.chat.completions.create(
        {
          model: AI_MODEL,
          stream: true,
          temperature: 0.7,
          max_tokens: AI_LIMITS.maxOutputTokens,
          messages: trimmedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          signal: abortController.signal,
        }
      );

      streamStarted = true;

      try {
        for await (const chunk of stream) {
          if (abortController.signal.aborted) {
            break;
          }

          const token = chunk.choices[0]?.delta?.content;
          if (token) {
            res.write(token);
          }
        }
      } catch (error) {
        if (abortController.signal.aborted) {
          console.log("Stream aborted by client");
        } else {
          throw error;
        }
      } finally {
        // Record estimated usage only if stream completed or started
        recordTokenUsage(estimatedTotalTokens);
        res.end();
      }
    } catch (error) {
      if ((error as any)?.name === "AbortError") {
        // Client cancelled — no error response needed
        return;
      }

      console.error("AI error:", error);
      res.status(500).json({ error: "AI request failed" });
    }
  };
}
