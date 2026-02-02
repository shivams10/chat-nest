export const MessageRole = {
	User: 'user',
	Assistant: 'assistant',
} as const;

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

export type Message = {
	id: string;
	role: MessageRole;
	content: string;
};

export type AiUsageProfile = "constrained" | "balanced" | "expanded";

export const AI_USAGE_PROFILE_DEFAULT: AiUsageProfile = "balanced";

export type UseAIChatOptions = {
	endpoint: string;
	initialMessages?: Message[];
	maxMessages?: number;
	initialProfile?: AiUsageProfile;
	/** Cap daily token budget (sent to server; server applies min(profile limit, this)). */
	dailyTokenLimit?: number;
	maxTokensPerRequest?: number;
};

export type UseAIChatReturn = {
	messages: Message[];
	sendMessage(text: string): Promise<void>;
	cancel(): void;
	isStreaming: boolean;
	error?: string;
	reset(): void;
	profile: AiUsageProfile;
	setProfile(profile: AiUsageProfile): void;
};

export type StreamCallbacks = {
	onToken(token: string): void;
	onComplete(): void;
	onError(error: Error): void;
};

export type ChatRequestOptions = {
	/** Cap daily token budget for this request. */
	dailyTokenLimit?: number;
	/** Cap max tokens per request (input + output) for this request. */
	maxTokensPerRequest?: number;
};

export interface AIClient {
	streamChat(
		messages: Message[],
		callbacks: StreamCallbacks,
		profile: AiUsageProfile,
		options?: ChatRequestOptions
	): Promise<void>;
	cancel(): void;
}

export type AiClientConfig = {
	endpoint: string;
	headers?: Record<string, string>;
	timeoutMs?: number;
	maxRetries?: number;
};
