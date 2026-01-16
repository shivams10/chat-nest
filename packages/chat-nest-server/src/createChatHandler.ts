import type { Message } from 'chat-nest-core';
import type { Request, Response } from 'express';
import OpenAI from 'openai';

import { AI_LIMITS, AI_MODEL } from './config/aiLimits.js';
import { BUDGET } from './config/budget.js';
import { estimateTokens } from './utils/tokenEstimator.js';
import { canSpendTokens, recordTokenUsage } from './utils/tokenBudget.js';

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
		throw new Error('OPENAI_API_KEY is missing');
	}

	const client = new OpenAI({
		apiKey: config.apiKey,
	});

	return async function handler(req: Request, res: Response) {
		const abortController = new AbortController();
		let streamStarted = false;
		let heartbeatInterval: NodeJS.Timeout | null = null;

		// Helper to write SSE-formatted events
		const writeSSE = (event: string, data: string) => {
			if (abortController.signal.aborted) return;
			res.write(`event: ${event}\ndata: ${data}\n\n`);
		};

		// Abort upstream request only if client disconnects mid-stream
		res.on('close', () => {
			if (heartbeatInterval) {
				clearInterval(heartbeatInterval);
				heartbeatInterval = null;
			}
			if (streamStarted && !abortController.signal.aborted) {
				abortController.abort();
			}
		});

		try {
			const body = req.body as { messages?: Message[] };

			if (!Array.isArray(body.messages)) {
				res.status(400).json({ error: 'Invalid messages payload' });
				return;
			}

			if (isRateLimited()) {
				res.status(429).json({
					error: 'Rate limit exceeded. Please slow down.',
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
					error: 'Daily AI budget exceeded. Try again tomorrow.',
				});
				return;
			}

			// SSE headers - flush immediately
			res.setHeader('Content-Type', 'text/event-stream');
			res.setHeader('Cache-Control', 'no-cache');
			res.setHeader('Connection', 'keep-alive');
			res.flushHeaders();

			// Emit start event
			writeSSE('start', '');

			// Start heartbeat ping every 15 seconds
			heartbeatInterval = setInterval(() => {
				if (!abortController.signal.aborted) {
					writeSSE('ping', '');
				}
			}, 15000);

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
						// SSE format: event: token\ndata: <JSON-encoded token>\n\n
						writeSSE('token', JSON.stringify(token));
					}
				}

				// Emit done event
				writeSSE('done', '');
			} catch (error) {
				if (abortController.signal.aborted) {
					console.log('Stream aborted by client');
				} else {
					// Emit error event as SSE (headers already sent)
					const errorData = JSON.stringify({
						message: error instanceof Error ? error.message : 'Unknown error',
					});
					writeSSE('error', errorData);
					// Don't throw - let finally handle cleanup
				}
			} finally {
				// Clear heartbeat when stream finishes
				if (heartbeatInterval) {
					clearInterval(heartbeatInterval);
					heartbeatInterval = null;
				}
				// Record estimated usage only if stream completed or started
				recordTokenUsage(estimatedTotalTokens);
				res.end();
			}
		} catch (error) {
			if ((error as any)?.name === 'AbortError') {
				// Client cancelled — no error response needed
				if (heartbeatInterval) {
					clearInterval(heartbeatInterval);
					heartbeatInterval = null;
				}
				return;
			}

			console.error('AI error:', error);
			// If headers not sent yet, send JSON error
			if (!res.headersSent) {
				res.status(500).json({ error: 'AI request failed' });
			} else {
				// Otherwise send SSE error event
				const errorData = JSON.stringify({
					message: 'AI request failed',
				});
				writeSSE('error', errorData);
				res.end();
			}
		}
	};
}
