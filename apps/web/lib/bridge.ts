/**
 * Unified IPC bridge wrapper with timeout, retry, and error classification
 * Used by electron-bridge.ts for all IPC operations
 */

export interface BridgeError extends Error {
  code?: string;
  timeout?: boolean;
  retryable?: boolean;
  classification?: "network" | "permission" | "data" | "unknown";
}

export interface BridgeOptions {
  timeout?: number; // milliseconds
  retries?: number;
  retryDelay?: number; // milliseconds
}

const DEFAULT_OPTIONS: Required<BridgeOptions> = {
  timeout: 5000, // 5 seconds
  retries: 2,
  retryDelay: 1000, // 1 second
};

/**
 * Classify an error to determine if it's retryable
 */
function classifyError(error: any): BridgeError["classification"] {
  const message = error?.message?.toLowerCase() || "";
  const code = error?.code?.toLowerCase() || "";

  // Network/timeout errors are retryable
  if (message.includes("timeout") || message.includes("network") || code === "etimedout") {
    return "network";
  }

  // Permission errors are usually not retryable
  if (message.includes("permission") || message.includes("access denied") || code === "eacces") {
    return "permission";
  }

  // Data validation errors are not retryable
  if (message.includes("invalid") || message.includes("validation") || message.includes("parse")) {
    return "data";
  }

  return "unknown";
}

/**
 * Check if an error is retryable
 */
function isRetryable(error: any): boolean {
  const classification = classifyError(error);
  return classification === "network" || classification === "unknown";
}

/**
 * Create a timeout promise
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error: BridgeError = new Error(`Operation timed out after ${ms}ms`);
      error.timeout = true;
      error.classification = "network";
      error.retryable = true;
      reject(error);
    }, ms);
  });
}

/**
 * Execute an IPC operation with timeout, retry, and error handling
 */
export async function ipcInvoke<T>(
  operation: () => Promise<T>,
  options: BridgeOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: BridgeError | null = null;

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      // Race the operation against a timeout
      const result = await Promise.race([
        operation(),
        createTimeout(opts.timeout),
      ]);

      return result;
    } catch (error: any) {
      lastError = error as BridgeError;
      lastError.classification = classifyError(error);
      lastError.retryable = isRetryable(error);

      // Don't retry if error is not retryable or we've exhausted retries
      if (!lastError.retryable || attempt >= opts.retries) {
        throw lastError;
      }

      // Wait before retrying
      if (attempt < opts.retries) {
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error("IPC operation failed");
}

/**
 * Check if running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== "undefined" && window.electronAPI !== undefined;
}

/**
 * Get IPC latency (for diagnostics)
 */
export async function measureIpcLatency(): Promise<number> {
  if (!isElectron() || !window.electronAPI) {
    return -1; // Not in Electron
  }

  try {
    const start = performance.now();
    await window.electronAPI.canUndo(); // Lightweight operation
    return performance.now() - start;
  } catch (error) {
    return -1; // Error measuring
  }
}

/**
 * Get bridge health status
 */
export interface BridgeHealth {
  available: boolean;
  latency: number;
  lastError: BridgeError | null;
}

let lastBridgeError: BridgeError | null = null;

export function getBridgeHealth(): BridgeHealth {
  return {
    available: isElectron(),
    latency: -1, // Will be measured asynchronously
    lastError: lastBridgeError,
  };
}

export function setBridgeError(error: BridgeError | null): void {
  lastBridgeError = error;
}

