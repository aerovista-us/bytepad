"use strict";
/**
 * Data versioning for BytePad
 * Used for schema migrations and compatibility checks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENT_DATA_VERSION = void 0;
exports.wrapWithVersion = wrapWithVersion;
exports.unwrapVersion = unwrapVersion;
exports.getDataVersion = getDataVersion;
exports.CURRENT_DATA_VERSION = 1;
function wrapWithVersion(data, version = exports.CURRENT_DATA_VERSION) {
    return {
        version,
        data,
    };
}
function unwrapVersion(versioned) {
    return versioned.data;
}
function getDataVersion(data) {
    if (data && typeof data === "object" && "version" in data) {
        return data.version;
    }
    return 0; // Legacy data, no version
}
