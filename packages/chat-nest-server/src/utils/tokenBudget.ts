let currentDay = new Date().toDateString();
let tokensUsedToday = 0;

export function canSpendTokens(estimated: number, limit: number) {
  const today = new Date().toDateString();

  if (today !== currentDay) {
    currentDay = today;
    tokensUsedToday = 0;
  }

  return tokensUsedToday + estimated <= limit;
}

export function recordTokenUsage(used: number) {
  tokensUsedToday += used;
}
