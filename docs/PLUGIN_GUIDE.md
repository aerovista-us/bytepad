# Plugin Development Guide

BytePad's plugin system allows you to extend core functionality through event hooks.

## Plugin Interface

```typescript
import type { Plugin, CoreInstance, Board, Note } from "bytepad-types";

export interface Plugin {
  name: string;

  // Lifecycle hooks
  onRegister?: (core: CoreInstance) => void;
  onInit?: (core: CoreInstance) => void;

  // Board hooks
  onBoardCreate?: (board: Board, core: CoreInstance) => void;
  onBoardUpdate?: (board: Board, core: CoreInstance) => void;
  onBoardDelete?: (id: string, core: CoreInstance) => void;

  // Note hooks
  onNoteCreate?: (boardId: string, note: Note, core: CoreInstance) => void;
  onNoteUpdate?: (boardId: string, note: Note, core: CoreInstance) => void;
  onNoteDelete?: (boardId: string, noteId: string, core: CoreInstance) => void;

  // Sync hook
  onSync?: (event: SyncEvent, core: CoreInstance) => Promise<void>;
}
```

## Creating a Plugin

### Basic Plugin Structure

```typescript
import type { Plugin, CoreInstance, Note } from "bytepad-types";

export const MyPlugin: Plugin = {
  name: "my-plugin",

  onRegister(core: CoreInstance) {
    console.log("MyPlugin registered");
  },

  onInit(core: CoreInstance) {
    console.log("MyPlugin initialized");
  },

  onNoteCreate(boardId: string, note: Note, core: CoreInstance) {
    console.log(`Note created: ${note.id} in board ${boardId}`);
  },
};
```

### Example: Auto-Tag Plugin

```typescript
import type { Plugin, CoreInstance, Note } from "bytepad-types";

export const AutoTagPlugin: Plugin = {
  name: "auto-tag",

  async onNoteCreate(boardId: string, note: Note, core: CoreInstance) {
    const content = note.contentHTML.toLowerCase();
    const tags: string[] = [];

    // Detect keywords and add tags
    if (content.includes("todo") || content.includes("task")) {
      tags.push("todo");
    }
    if (content.includes("idea") || content.includes("concept")) {
      tags.push("idea");
    }
    if (content.includes("bug") || content.includes("issue")) {
      tags.push("issue");
    }

    // Update note with tags if any were found
    if (tags.length > 0) {
      await core.updateNote(boardId, note.id, {
        tags: [...(note.tags || []), ...tags],
      });
    }
  },
};
```

## Registering Plugins

### In Web App

```typescript
// apps/web/app/providers.tsx
import { BytePadCore } from "bytepad-core";
import { MyPlugin } from "./plugins/my-plugin";

const core = new BytePadCore({ storage: driver });
core.registerPlugin(MyPlugin);
await core.init();
```

### In Electron

```typescript
// apps/desktop/src/main/core/setup.ts
import { BytePadCore } from "bytepad-core";
import { MyPlugin } from "./plugins/my-plugin";

const core = new BytePadCore({ storage: driver });
core.registerPlugin(MyPlugin);
return core;
```

## Plugin Best Practices

### 1. Avoid Side Effects in Hooks

Don't perform heavy operations synchronously in hooks. Use async operations or queue them.

```typescript
// ❌ Bad: Heavy operation in hook
onNoteCreate(boardId, note, core) {
  processLargeFile(note); // Blocks execution
}

// ✅ Good: Queue or async
onNoteCreate(boardId, note, core) {
  queueMicrotask(() => {
    processLargeFile(note);
  });
}
```

### 2. Handle Errors Gracefully

Always wrap plugin logic in try-catch to prevent breaking the core.

```typescript
onNoteCreate(boardId, note, core) {
  try {
    // Plugin logic
  } catch (error) {
    console.error("Plugin error:", error);
    // Don't throw - let core continue
  }
}
```

### 3. Use Core Events for Communication

Plugins can listen to core events for cross-plugin communication.

```typescript
onRegister(core) {
  core.events.on("noteCreated", (payload) => {
    // React to note creation
  });
}
```

### 4. Avoid Circular Dependencies

Don't create plugins that depend on each other in circular ways.

## Advanced: Sync Plugins

Plugins can implement sync functionality for external services.

```typescript
export const CloudSyncPlugin: Plugin = {
  name: "cloud-sync",

  async onSync(event: SyncEvent, core: CoreInstance) {
    if (event.type === "update") {
      await syncToCloud(event.payload);
    } else if (event.type === "delete") {
      await deleteFromCloud(event.payload.id);
    }
  },
};
```

## Testing Plugins

```typescript
import { describe, it, expect } from "vitest";
import { BytePadCore } from "bytepad-core";
import { MyPlugin } from "./my-plugin";
import { createMockDriver } from "./test-utils";

describe("MyPlugin", () => {
  it("should execute on note create", async () => {
    const core = new BytePadCore({ storage: createMockDriver() });
    core.registerPlugin(MyPlugin);
    await core.init();

    const board = await core.createBoard({ name: "Test" });
    const note = await core.createNote(board.id, { contentHTML: "<p>Test</p>" });

    // Assert plugin behavior
    expect(note.tags).toContain("test-tag");
  });
});
```

## Plugin Distribution

### Package Structure

```
bytepad-plugin-my-plugin/
├── package.json
├── src/
│   └── index.ts
└── README.md
```

### package.json

```json
{
  "name": "bytepad-plugin-my-plugin",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "peerDependencies": {
    "bytepad-types": "^3.0.0"
  }
}
```

## Official Plugins

BytePad includes several official plugins:

- **TagGeneratorPlugin**: Automatic tag generation based on content
- More plugins coming soon...

## Related Documentation

- [API.md](./API.md) - Core API reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture

