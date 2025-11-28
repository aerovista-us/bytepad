# NXDrive Driver Status

## Current Status: BLOCKED

The NXDrive driver implementation is **blocked** pending NXCore API documentation and availability.

## Implementation Details

### Current Implementation

The NXDrive driver (`packages/bytepad-storage/src/nxdrive.ts`) is a **placeholder implementation** that:

- ✅ Implements the `StorageDriver` interface
- ✅ Includes health check functionality
- ✅ Supports backup operations (theoretically)
- ❌ **Cannot actually read/write** - requires NXCore API endpoints
- ❌ **Cannot be used in production** - will fall back to IndexedDB

### What's Needed

To complete the NXDrive driver, the following NXCore API information is required:

1. **API Endpoint URLs**
   - How to access NXDrive storage from the panel
   - Authentication/authorization mechanism
   - Base URL or path structure

2. **Read/Write Operations**
   - HTTP methods (GET, POST, PUT, DELETE)
   - Request/response formats
   - Error handling conventions

3. **File Path Structure**
   - Where BytePad boards are stored in NXDrive
   - File naming conventions
   - Directory structure

4. **Offline Handling**
   - How to detect when NXCore is offline
   - Retry strategies
   - Conflict resolution

## Fallback Behavior

The `DriverManager` automatically falls back to IndexedDB when:

- NXDrive driver health check fails
- NXDrive read/write operations fail
- NXCore is offline or unavailable

This ensures the panel continues to function even when NXDrive is unavailable.

## Panel Integration

The panel (`apps/web/app/panel/page.tsx`) currently uses IndexedDB via `CoreProvider`.

**To enable NXDrive when API is available:**

1. Update `apps/web/app/providers.tsx` to use `DriverManager` instead of direct `indexedDbDriver`
2. Configure `DriverManager` with NXDrive path when in panel context
3. The manager will automatically use NXDrive if healthy, otherwise fall back to IndexedDB

Example (when API is available):

```typescript
// In providers.tsx
import { DriverManager } from "bytepad-storage";

const manager = new DriverManager({
  nxdrivePath: "/srv/NXDrive/bytepad/boards.json", // NXCore API path
  indexedDbName: "bytepad-panel", // Fallback
});

await manager.initialize();
const core = new BytePadCore({ storage: manager });
```

## Testing

The NXDrive driver cannot be fully tested until the NXCore API is available. Current tests verify:

- Driver interface compliance
- Health check behavior
- Fallback logic in DriverManager

## Next Steps

1. **Wait for NXCore API documentation**
2. **Implement real read/write operations** once API is documented
3. **Update panel to use DriverManager** with NXDrive configuration
4. **Test end-to-end** with real NXCore instance
5. **Document conflict resolution** strategy

## Related Files

- `packages/bytepad-storage/src/nxdrive.ts` - Driver implementation
- `packages/bytepad-storage/src/driver-manager.ts` - Fallback manager
- `apps/web/app/panel/page.tsx` - Panel UI (currently uses IndexedDB)
- `apps/web/app/providers.tsx` - Core initialization (needs update for NXDrive)

