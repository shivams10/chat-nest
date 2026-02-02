export const AIUsageProfile = {
	CONSTRAINED: 'constrained',
	BALANCED: 'balanced',
	EXPANDED: 'expanded',
} as const;

export type AIUsageProfileType =
	(typeof AIUsageProfile)[keyof typeof AIUsageProfile];

export type ProfileLimits = {
	maxOutputTokens: number;
	maxMessages: number;
	temperature: number;
	dailyTokenLimit: number;
	maxTokensPerRequest: number;
	rateLimit: { windowMs: number; maxRequests: number };
};

export const HARD_CAPS: ProfileLimits = {
	maxOutputTokens: 4096,
	maxMessages: 20,
	temperature: 2,
	dailyTokenLimit: 500_000,
	maxTokensPerRequest: 16_000,
	rateLimit: { windowMs: 60_000, maxRequests: 60 },
} as const;

function clampToCaps(limits: ProfileLimits): ProfileLimits {
	return {
		maxOutputTokens: Math.min(limits.maxOutputTokens, HARD_CAPS.maxOutputTokens),
		maxMessages: Math.min(limits.maxMessages, HARD_CAPS.maxMessages),
		temperature: Math.min(limits.temperature, HARD_CAPS.temperature),
		dailyTokenLimit: Math.min(limits.dailyTokenLimit, HARD_CAPS.dailyTokenLimit),
		maxTokensPerRequest: Math.min(
			limits.maxTokensPerRequest,
			HARD_CAPS.maxTokensPerRequest
		),
		rateLimit: {
			windowMs: limits.rateLimit.windowMs,
			maxRequests: Math.min(
				limits.rateLimit.maxRequests,
				HARD_CAPS.rateLimit.maxRequests
			),
		},
	};
}

const DEFAULT_MAX_TOKENS_PER_REQUEST = 2048;

export const PROFILES: Record<AIUsageProfileType, ProfileLimits> = {
	[AIUsageProfile.CONSTRAINED]: clampToCaps({
		maxOutputTokens: 150,
		maxMessages: 4,
		temperature: 0.5,
		dailyTokenLimit: 30_000,
		maxTokensPerRequest: DEFAULT_MAX_TOKENS_PER_REQUEST,
		rateLimit: { windowMs: 60_000, maxRequests: 15 },
	}),
	[AIUsageProfile.BALANCED]: clampToCaps({
		maxOutputTokens: 400,
		maxMessages: 6,
		temperature: 0.7,
		dailyTokenLimit: 70_000,
		maxTokensPerRequest: DEFAULT_MAX_TOKENS_PER_REQUEST,
		rateLimit: { windowMs: 60_000, maxRequests: 30 },
	}),
	[AIUsageProfile.EXPANDED]: clampToCaps({
		maxOutputTokens: 3000,
		maxMessages: 12,
		temperature: 0.8,
		dailyTokenLimit: 200_000,
		maxTokensPerRequest: 12_000, // input (~9k) + output (3k) for 12 msgs
		rateLimit: { windowMs: 60_000, maxRequests: 60 },
	}),
} as const;

const LEGACY_MAP: Record<string, AIUsageProfileType> = {
	budget: AIUsageProfile.CONSTRAINED,
	moderate: AIUsageProfile.BALANCED,
	free: AIUsageProfile.EXPANDED,
};

const VALID_PROFILE_STRINGS = new Set<string>([
	AIUsageProfile.CONSTRAINED,
	AIUsageProfile.BALANCED,
	AIUsageProfile.EXPANDED,
	...Object.keys(LEGACY_MAP),
]);

export function resolveProfile(
	input: unknown
): { limits: ProfileLimits; profile: AIUsageProfileType } {
	const s = typeof input === 'string' ? input.toLowerCase().trim() : '';
	const profile =
		LEGACY_MAP[s] ?? (VALID_PROFILE_STRINGS.has(s) ? (s as AIUsageProfileType) : null) ?? AIUsageProfile.BALANCED;
	return { limits: PROFILES[profile], profile };
}
