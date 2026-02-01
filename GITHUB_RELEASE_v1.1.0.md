# 🚀 v1.1.0 - Server-Side Events (SSE) Migration

## Major Changes

**Migration to Server-Side Events (SSE)** - All streaming communication now uses SSE protocol for more efficient, real-time token delivery.

## ✨ What's New

### chat-nest-server
- SSE streaming with event types: `start`, `token`, `done`, `error`, `ping`
- Automatic heartbeat pings every 15 seconds
- Improved streaming efficiency

### chat-nest-sdk
- SSE client with automatic event parsing
- Real-time token streaming via SSE
- Same API, improved implementation

## 📦 Updated Packages

- `chat-nest-core@1.1.0`
- `chat-nest-sdk@1.1.0`
- `chat-nest-server@1.1.0`

## 🔄 Migration

**No breaking changes** - Same API interface, SSE is handled automatically under the hood.

## 📚 Documentation

All README files updated with SSE implementation details.

---

**Install:**
```bash
npm install chat-nest-sdk@1.1.0
npm install chat-nest-server@1.1.0
npm install chat-nest-core@1.1.0
```
