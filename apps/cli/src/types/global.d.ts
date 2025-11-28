// Type declarations for browser globals in Node.js context
// These are used by packages that support both browser and Node.js environments

declare var window: {
  localStorage?: Storage;
  fetch?: typeof fetch;
} | undefined;

declare var localStorage: Storage;

// Storage interface for compatibility
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  readonly length: number;
  key(index: number): string | null;
}

// Fix for BackupManager constructor
declare var globalThis: {
  localStorage?: Storage;
};

