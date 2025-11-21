/**
 * Performance monitoring and optimization utilities
 */

export interface PerformanceMetrics {
  renderTime: number;
  operationTime: number;
  memoryUsage?: number;
}

/**
 * Measure execution time of a function
 */
export async function measureTime<T>(
  fn: () => Promise<T> | T,
  label?: string
): Promise<{ result: T; time: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const time = end - start;

  if (label) {
    console.log(`[Performance] ${label}: ${time.toFixed(2)}ms`);
  }

  return { result, time };
}

/**
 * Measure render time of a React component
 */
export function measureRenderTime(componentName: string) {
  const start = performance.now();

  return () => {
    const end = performance.now();
    const renderTime = end - start;
    console.log(`[Performance] ${componentName} render: ${renderTime.toFixed(2)}ms`);
    return renderTime;
  };
}

/**
 * Get memory usage (if available)
 */
export function getMemoryUsage(): number | null {
  if (typeof performance !== "undefined" && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return null;
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      fn(...args);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn(...args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Batch multiple operations together
 */
export function batchOperations<T>(
  operations: Array<() => Promise<T>>,
  batchSize: number = 10
): Promise<T[]> {
  const results: T[] = [];
  
  return new Promise(async (resolve, reject) => {
    try {
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((op) => op()));
        results.push(...batchResults);
      }
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Lazy load data
 */
export function createLazyLoader<T>(
  loader: () => Promise<T>,
  cache: Map<string, T> = new Map()
) {
  return async (key: string): Promise<T> => {
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const data = await loader();
    cache.set(key, data);
    return data;
  };
}

