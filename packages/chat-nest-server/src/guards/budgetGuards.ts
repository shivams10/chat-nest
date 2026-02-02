import type { Message } from 'chat-nest-core';
import type { ProfileLimits } from '../config/profiles.js';
import { estimateTokens } from '../utils/tokenEstimator.js';
import { canSpendTokens } from '../utils/tokenBudget.js';

export function trimMessages(messages: Message[], maxMessages: number): Message[] {
	return messages.slice(-maxMessages);
}

export type BudgetCheckResult =
	| { success: true; estimatedTotal: number }
	| {
			success: false;
			estimatedTotal: number;
			reason: 'request_limit' | 'daily_limit';
	  };

export function checkBudget(
	messages: Message[],
	limits: ProfileLimits
): BudgetCheckResult {
	const estimatedInput = estimateTokens(messages);
	const estimatedTotal = estimatedInput + limits.maxOutputTokens;

	if (estimatedTotal > limits.maxTokensPerRequest) {
		return { success: false, estimatedTotal, reason: 'request_limit' };
	}
	if (!canSpendTokens(estimatedTotal, limits.dailyTokenLimit)) {
		return { success: false, estimatedTotal, reason: 'daily_limit' };
	}
	return { success: true, estimatedTotal };
}
