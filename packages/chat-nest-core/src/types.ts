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

export type UseAIChatOptions = {
	endpoint: string;
	initialMessages?: Message[];
	maxMessages?: number;
};

export type UseAIChatReturn = {
	messages: Message[];
	sendMessage(text: string): Promise<void>;
	cancel(): void;
	isStreaming: boolean;
	error?: string;
	reset(): void;
};

export type StreamCallbacks = {
	onToken(token: string): void;
	onComplete(): void;
	onError(error: Error): void;
};

export interface AIClient {
	streamChat(messages: Message[], callbacks: StreamCallbacks): void;
	cancel(): void;
}

export type AiClientConfig = {
	endpoint: string;
	headers?: Record<string, string>;
	timeoutMs?: number;
	maxRetries?: number;
};
