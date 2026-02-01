import type {
	Message,
	StreamCallbacks,
	AIClient,
	AiClientConfig,
	AiUsageProfile,
	ChatRequestOptions,
} from 'chat-nest-core';
import { getSystemPromptForProfile } from './promptPresets.js';

const DEFAULT_TIMEOUT = 30_000; // 30s
const DEFAULT_RETRIES = 2;

class NonRetryableError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'NonRetryableError';
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
		callbacks: StreamCallbacks,
		profile: AiUsageProfile,
		options?: ChatRequestOptions
	): Promise<void> {
		let attempt = 0;

		while (attempt <= this.config.maxRetries) {
			try {
				await this.executeStream(messages, callbacks, profile, options);
				return;
			} catch (error) {
				if ((error as any)?.name === 'AbortError') {
					return;
				}

				if (error instanceof Error && error.name === 'NonRetryableError') {
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
		callbacks: StreamCallbacks,
		profile: AiUsageProfile,
		options?: ChatRequestOptions
	) {
		this.abortController = new AbortController();

		const timeoutId = setTimeout(
			() => this.abortController?.abort(),
			this.config.timeoutMs
		);

		let completed = false;

		try {
			const response = await fetch(this.config.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...this.config.headers,
				},
				signal: this.abortController.signal,
				body: JSON.stringify({
					messages,
					profile,
					systemPrompt: getSystemPromptForProfile(profile),
					...(options?.dailyTokenLimit != null && {
						dailyTokenLimit: options.dailyTokenLimit,
					}),
					...(options?.maxTokensPerRequest != null && {
						maxTokensPerRequest: options.maxTokensPerRequest,
					}),
				}),
			});

			if (!response.ok) {
				if (response.status >= 400 && response.status < 500) {
					throw new NonRetryableError(`HTTP ${response.status}`);
				}
				throw new Error(`HTTP ${response.status}`);
			}

			if (!response.body) {
				throw new Error('Streaming not supported by the response');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				if (this.abortController.signal.aborted) {
					throw new DOMException('Aborted', 'AbortError');
				}

				const { value, done } = await reader.read();

				if (value) {
					buffer += decoder.decode(value, { stream: true });
				}

				const events = buffer.split('\n\n');
				buffer = events.pop() || '';

				for (const eventText of events) {
					if (!eventText.trim()) continue;

					let eventType = '';
					let eventDataParts: string[] = [];

					for (const line of eventText.split('\n')) {
						if (line.startsWith('event:')) {
							eventType = line.substring(6).trim();
						} else if (line.startsWith('data:')) {
							eventDataParts.push(line.substring(5).trim());
						}
					}

					const eventData = eventDataParts.join('\n');

					switch (eventType) {
						case 'token': {
							try {
								const token = JSON.parse(eventData);
								callbacks.onToken(token);
							} catch {
								callbacks.onToken(eventData);
							}
							break;
						}

						case 'done':
							completed = true;
							callbacks.onComplete();
							return;

						case 'error':
							completed = true;
							try {
								const errorObj = JSON.parse(eventData);
								callbacks.onError(
									new Error(errorObj.message || 'Stream error')
								);
							} catch {
								callbacks.onError(new Error(eventData || 'Stream error'));
							}
							return;

						case 'ping':
						case 'start':
							break;
					}
				}

				if (done) break;
			}

			if (!completed) {
				callbacks.onComplete();
			}
		} finally {
			clearTimeout(timeoutId);
		}
	}

	private normalizeError(error: unknown): Error {
		if ((error as any)?.name === 'AbortError') {
			return new Error('Request cancelled by user');
		}

		if (error instanceof Error) {
			return error;
		}

		return new Error('Unknown AI client error');
	}

	private async backoff(attempt: number) {
		const delay = Math.min(1000 * attempt, 3000);
		return new Promise((resolve) => setTimeout(resolve, delay));
	}
}
