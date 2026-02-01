import type { Response } from 'express';

export function createSSEWriter(
	res: Response,
	abortSignal: AbortSignal
): {
	write: (event: string, data: string) => void;
	startHeartbeat: (intervalMs?: number) => NodeJS.Timeout;
	stopHeartbeat: (id: NodeJS.Timeout | null) => void;
} {
	const write = (event: string, data: string) => {
		if (abortSignal.aborted) return;
		res.write(`event: ${event}\ndata: ${data}\n\n`);
	};

	const startHeartbeat = (intervalMs = 15000) => {
		return setInterval(() => {
			if (!abortSignal.aborted) write('ping', '');
		}, intervalMs);
	};

	const stopHeartbeat = (id: NodeJS.Timeout | null) => {
		if (id) clearInterval(id);
	};

	return { write, startHeartbeat, stopHeartbeat };
}

/** Minimal AbortSignal-like for typing */
type AbortSignal = { aborted: boolean };
