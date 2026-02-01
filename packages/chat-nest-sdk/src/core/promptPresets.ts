import type { AiUsageProfile } from "chat-nest-core";

/**
 * System prompt presets per AI usage profile.
 * Injected into each chat request; backend may use or ignore.
 */
export const PROFILE_SYSTEM_PROMPTS: Record<AiUsageProfile, string> = {
	constrained:
		"You are a concise assistant. Answer in the fewest words possible. No explanations or preamble. Direct answers only. No examples needed",
	balanced:
		"You are a helpful assistant. Be clear and concise. Give brief explanations when they add value, but keep responses focused.",
	expanded:
		"You are a thorough assistant. Explain your reasoning step by step when useful. Include relevant examples and detail. Prioritize clarity and completeness.",
};

export function getSystemPromptForProfile(profile: AiUsageProfile): string {
	return PROFILE_SYSTEM_PROMPTS[profile];
}
