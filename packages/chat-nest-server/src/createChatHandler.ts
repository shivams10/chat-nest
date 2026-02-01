import type { Message } from 'chat-nest-core';
import type { Request, Response } from 'express';
import OpenAI from 'openai';

import { resolveProfile } from './config/profiles.js';
import { isRateLimited } from './guards/rateLimit.js';
import { trimMessages, checkBudget } from './guards/budgetGuards.js';
import { createSSEWriter } from './sse/sseWriter.js';
import { streamChatCompletion } from './streaming/openaiStream.js';
import { recordTokenUsage } from './utils/tokenBudget.js';

export type ChatHandlerConfig = {
	apiKey: string;
};

export function createChatHandler(config: ChatHandlerConfig) {
	if (!config.apiKey) {
		throw new Error('OPENAI_API_KEY is missing');
	}

	const client = new OpenAI({ apiKey: config.apiKey });

	return async function handler(req: Request, res: Response) {
		const abortController = new AbortController();
		let streamStarted = false;
		let heartbeatId: NodeJS.Timeout | null = null;

		const body = req.body as {
			messages?: Message[];
			profile?: unknown;
			aiUsageProfile?: unknown;
			dailyTokenLimit?: number;
			maxTokensPerRequest?: number;
		};
		const { limits: profileLimits } = resolveProfile(
			body.profile ?? body.aiUsageProfile
		);
		let effectiveLimits = { ...profileLimits };
		if (body.dailyTokenLimit != null) {
			effectiveLimits = {
				...effectiveLimits,
				dailyTokenLimit: Math.min(
					profileLimits.dailyTokenLimit,
					body.dailyTokenLimit
				),
			};
		}
		if (body.maxTokensPerRequest != null) {
			effectiveLimits = {
				...effectiveLimits,
				maxTokensPerRequest: Math.min(
					profileLimits.maxTokensPerRequest,
					body.maxTokensPerRequest
				),
			};
		}

		if (!Array.isArray(body.messages)) {
			res.status(400).json({ error: 'Invalid messages payload' });
			return;
		}

		if (isRateLimited(effectiveLimits)) {
			res.status(429).json({
				error: 'Rate limit exceeded. Please slow down.',
			});
			return;
		}

		const trimmedMessages = trimMessages(
			body.messages,
			effectiveLimits.maxMessages
		);
		const budgetResult = checkBudget(trimmedMessages, effectiveLimits);

		if (!budgetResult.success) {
			const errorMessage =
				budgetResult.reason === 'request_limit'
					? 'Request too large. Please shorten your message.'
					: 'Daily AI budget exceeded. Try again tomorrow.';
			res.status(429).json({ error: errorMessage });
			return;
		}

		const { write, startHeartbeat, stopHeartbeat } = createSSEWriter(
			res,
			abortController.signal
		);

		res.on('close', () => {
			stopHeartbeat(heartbeatId);
			if (streamStarted && !abortController.signal.aborted) {
				abortController.abort();
			}
		});

		try {
			res.setHeader('Content-Type', 'text/event-stream');
			res.setHeader('Cache-Control', 'no-cache');
			res.setHeader('Connection', 'keep-alive');
			res.flushHeaders();

			write('start', '');
			heartbeatId = startHeartbeat(15000);

			streamStarted = true;

			try {
				await streamChatCompletion(
					client,
					trimmedMessages,
					effectiveLimits,
					write,
					abortController.signal
				);
			} catch (streamError) {
				if (abortController.signal.aborted) {
					console.log('Stream aborted by client');
				} else {
					const msg =
						streamError instanceof Error
							? streamError.message
							: 'Unknown error';
					write('error', JSON.stringify({ message: msg }));
				}
			} finally {
				stopHeartbeat(heartbeatId);
				heartbeatId = null;
				recordTokenUsage(budgetResult.estimatedTotal);
				res.end();
			}
		} catch (error) {
			if ((error as any)?.name === 'AbortError') {
				stopHeartbeat(heartbeatId);
				return;
			}

			console.error('AI error:', error);
			if (!res.headersSent) {
				res.status(500).json({ error: 'AI request failed' });
			} else {
				write('error', JSON.stringify({ message: 'AI request failed' }));
				res.end();
			}
		}
	};
}
