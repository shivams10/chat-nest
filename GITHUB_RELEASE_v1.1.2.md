# v1.1.2 - maxTokensPerRequest fix + Customizable profiles docs

## Patch changes

- **maxTokensPerRequest**: Profile-specific limits (constrained/balanced: 2048, expanded: 12k). Client can cap via `maxTokensPerRequest`; server applies `min(profile, client)`.
- **Docs**: README updates for customizable profiles, request body options, and SDK options across all packages.

## Packages

- `chat-nest-core@1.1.2`
- `chat-nest-sdk@1.1.2`
- `chat-nest-server@1.1.2`

**Install:**
```bash
npm install chat-nest-sdk@1.1.2
npm install chat-nest-server@1.1.2
npm install chat-nest-core@1.1.2
```
