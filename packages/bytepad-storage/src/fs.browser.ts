// Browser stub for fsDriver - not available in browser environment
// fsDriver is only available in Node.js environments (Electron, CLI)

export function fsDriver() {
  throw new Error(
    'fsDriver is not available in browser environments. ' +
    'Use indexedDbDriver for browser-based storage.'
  );
}

