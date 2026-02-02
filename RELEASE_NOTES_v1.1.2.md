# Release v1.1.2 - maxTokensPerRequest fix + Customizable profiles docs

## Patch changes

### maxTokensPerRequest

- Profile-specific `maxTokensPerRequest` limits: constrained/balanced use 2048, expanded uses 12,000
- Client can override via `maxTokensPerRequest` in `useAiChat` options; server applies `min(profile limit, client value)`
- HARD_CAPS clamps all profiles at 16,000 tokens per request

### Documentation

- Root README: Cost controls, customizable profiles, SDK example with profile/limits
- chat-nest-server README: Request body options table (`profile`, `aiUsageProfile`, `dailyTokenLimit`, `maxTokensPerRequest`)
- chat-nest-sdk README: Full `useAiChat` options, return value including `profile`/`setProfile`, example with profile selector

## Package versions

- `chat-nest-core`: 1.1.2
- `chat-nest-sdk`: 1.1.2
- `chat-nest-server`: 1.1.2

## Install

```bash
npm install chat-nest-sdk@1.1.2
npm install chat-nest-server@1.1.2
npm install chat-nest-core@1.1.2
```

---

**Full Changelog**: https://github.com/shivams10/chat-nest/compare/v1.1.1...v1.1.2
