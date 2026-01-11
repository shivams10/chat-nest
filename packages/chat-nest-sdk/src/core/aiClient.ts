import type {
	Message,
	StreamCallbacks,
	AIClient,
	AiClientConfig,
  } from "chat-nest-core";
  
  const DEFAULT_TIMEOUT = 30_000; // 30s
  const DEFAULT_RETRIES = 2;
  
  /**
   * Errors that must NEVER be retried (4xx, policy, validation, etc)
   */
  class NonRetryableError extends Error {
	constructor(message: string) {
	  super(message);
	  this.name = "NonRetryableError";
	}
  }
  
  export class FetchAiClient implements AIClient {
	private abortController?: AbortController;
	private config: Required<AiClientConfig>;
  
	constructor(config: AiClientConfig) {
	  this.config = {
		endpoint: config.endpoint,
		headers: config.headers ?? {},
		timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT,
		maxRetries: config.maxRetries ?? DEFAULT_RETRIES,
	  };
	}
  
	async streamChat(
	  messages: Message[],
	  callbacks: StreamCallbacks
	): Promise<void> {
	  let attempt = 0;
  
	  while (attempt <= this.config.maxRetries) {
		try {
		  await this.executeStream(messages, callbacks);
		  return;
		} catch (error) {
		  // ✅ Abort → never retry
		  if ((error as any)?.name === "AbortError") {
			return;
		  }
  
		  // ✅ Client / policy error → never retry
		  if (error instanceof Error && error.name === "NonRetryableError") {
			callbacks.onError(this.normalizeError(error));
			return;
		  }
  
		  attempt++;
  
		  if (attempt > this.config.maxRetries) {
			callbacks.onError(this.normalizeError(error));
			return;
		  }
  
		  await this.backoff(attempt);
		}
	  }
	}
  
	cancel() {
	  this.abortController?.abort();
	}
  
	private async executeStream(
	  messages: Message[],
	  callbacks: StreamCallbacks
	) {
	  this.abortController = new AbortController();
  
	  const timeoutId = setTimeout(
		() => this.abortController?.abort(),
		this.config.timeoutMs
	  );
  
	  try {
		const response = await fetch(this.config.endpoint, {
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
			...this.config.headers,
		  },
		  signal: this.abortController.signal,
		  body: JSON.stringify({ messages }),
		});
  
		if (!response.ok) {
		  // ✅ 4xx → never retry
		  if (response.status >= 400 && response.status < 500) {
			throw new NonRetryableError(`HTTP ${response.status}`);
		  }
  
		  // ✅ 5xx → retryable
		  throw new Error(`HTTP ${response.status}`);
		}
  
		if (!response.body) {
		  throw new Error("Streaming not supported by the response");
		}
  
		const reader = response.body.getReader();
		const decoder = new TextDecoder();
  
		while (true) {
		  const { value, done } = await reader.read();
		  if (done) break;
  
		  const chunk = decoder.decode(value, { stream: true });
		  callbacks.onToken(chunk);
		}
  
		callbacks.onComplete();
	  } finally {
		clearTimeout(timeoutId);
	  }
	}
  
	private normalizeError(error: unknown): Error {
	  if ((error as any)?.name === "AbortError") {
		return new Error("Request cancelled by user");
	  }
  
	  if (error instanceof Error) {
		return error;
	  }
  
	  return new Error("Unknown AI client error");
	}
  
	private async backoff(attempt: number) {
	  const delay = Math.min(1000 * attempt, 3000);
	  return new Promise((resolve) => setTimeout(resolve, delay));
	}
  }
  