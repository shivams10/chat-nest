import type OpenAI from 'openai';
import type { Message } from 'chat-nest-core';
import type { ProfileLimits } from '../config/profiles.js';
import { AI_MODEL } from '../config/aiLimits.js';

export type WriteSSE = (event: string, data: string) => void;

export async function streamChatCompletion(
	client: OpenAI,
	messages: Message[],
	limits: ProfileLimits,
	writeSSE: WriteSSE,
	signal: AbortSignal
): Promise<void> {
	const stream = await client.chat.completions.create(
		{
			model: AI_MODEL,
			stream: true,
			temperature: limits.temperature,
			max_tokens: limits.maxOutputTokens,
			messages: messages.map((m) => ({ role: m.role, content: m.content })),
		},
		{ signal }
	);

	for await (const chunk of stream) {
		if (signal.aborted) break;

		const token = chunk.choices[0]?.delta?.content;
		if (token) {
			writeSSE('token', JSON.stringify(token));
		}
	}

	writeSSE('done', '');
}
