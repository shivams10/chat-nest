export const AI_MODEL = "gpt-4o-mini";

export const AI_LIMITS = {
  maxOutputTokens: 300,
  maxMessages: 6,
  rateLimitWindowMs: 60_000,
  maxRequestsPerWindow: 30,
} as const;
