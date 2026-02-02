# Release v1.1.0 - Server-Side Events (SSE) Migration

## 🚀 Major Changes

### Migration to Server-Side Events (SSE)

This release migrates the entire streaming architecture from traditional API calls to **Server-Side Events (SSE)** protocol for more efficient, real-time communication.

## ✨ What's New

### chat-nest-server
- **SSE Streaming**: All responses now use Server-Side Events protocol
- **SSE Event Types**: Supports `start`, `token`, `done`, `error`, and `ping` events
- **Heartbeat Pings**: Automatic connection keep-alive pings every 15 seconds
- **Improved Streaming**: More efficient token delivery with SSE format
- **Better Error Handling**: SSE-formatted error events for mid-stream failures

### chat-nest-sdk
- **SSE Client**: Updated to parse and handle SSE-formatted responses
- **Event Parsing**: Automatic parsing of SSE events (`event: <type>\ndata: <data>\n\n`)
- **Real-time Streaming**: Improved real-time token streaming via SSE protocol
- **Backward Compatible**: Same API interface, improved underlying implementation

### chat-nest-core
- **Version Sync**: Updated to maintain compatibility across packages

## 📦 Package Versions

- `chat-nest-core`: `1.0.1` → `1.1.0`
- `chat-nest-sdk`: `1.0.1` → `1.1.0`
- `chat-nest-server`: `1.0.1` → `1.1.0`

## 🔄 Migration Notes

### For Backend Users

The server now automatically sends SSE-formatted events. No code changes required if you're using `createChatHandler` - it handles SSE formatting automatically.

**SSE Event Format:**
```
event: start
data: 

event: token
data: <token>

event: done
data: 

event: error
data: {"message": "error details"}

event: ping
data: 
```

### For Frontend Users

The SDK automatically handles SSE parsing. No code changes required - the same `useAiChat` hook works as before, but now uses SSE under the hood.

## 🐛 Bug Fixes

- Improved connection stability with heartbeat pings
- Better error handling during stream interruptions
- More reliable cancellation propagation

## 📚 Documentation Updates

- Updated all README files with SSE implementation details
- Added SSE event type documentation
- Included heartbeat and connection management information

## 🔗 Links

- [SDK Documentation](packages/chat-nest-sdk/README.md)
- [Server Documentation](packages/chat-nest-server/README.md)
- [NPM: chat-nest-sdk](https://www.npmjs.com/package/chat-nest-sdk)
- [NPM: chat-nest-server](https://www.npmjs.com/package/chat-nest-server)
- [NPM: chat-nest-core](https://www.npmjs.com/package/chat-nest-core)

---

**Full Changelog**: https://github.com/shivams10/chat-nest/compare/v1.0.0...v1.1.0
