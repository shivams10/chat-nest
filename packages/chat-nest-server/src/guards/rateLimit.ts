import type { ProfileLimits } from '../config/profiles.js';

/** Global rate limit state (one bucket, check against current request's profile limit) */
let requestCount = 0;
let windowStart = Date.now();

export function isRateLimited(limits: ProfileLimits): boolean {
	const { windowMs, maxRequests } = limits.rateLimit;
	const now = Date.now();

	if (now - windowStart > windowMs) {
		windowStart = now;
		requestCount = 0;
	}

	requestCount++;
	return requestCount > maxRequests;
}
