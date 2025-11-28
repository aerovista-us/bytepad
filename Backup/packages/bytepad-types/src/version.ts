/**
 * Data versioning for BytePad
 * Used for schema migrations and compatibility checks
 */

export const CURRENT_DATA_VERSION = 1;

export interface VersionedData {
  version: number;
  data: any;
}

export function wrapWithVersion<T>(data: T, version: number = CURRENT_DATA_VERSION): VersionedData {
  return {
    version,
    data,
  };
}

export function unwrapVersion<T>(versioned: VersionedData): T {
  return versioned.data as T;
}

export function getDataVersion(data: any): number {
  if (data && typeof data === "object" && "version" in data) {
    return (data as VersionedData).version;
  }
  return 0; // Legacy data, no version
}

