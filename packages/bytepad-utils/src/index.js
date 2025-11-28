"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeHTML = void 0;
exports.debounce = debounce;
exports.throttle = throttle;
exports.safeJsonParse = safeJsonParse;
exports.safeJsonStringify = safeJsonStringify;
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
function throttle(fn, interval) {
    let lastTime = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastTime >= interval) {
            lastTime = now;
            fn(...args);
        }
    };
}
function safeJsonParse(value, fallback) {
    try {
        return JSON.parse(value);
    }
    catch {
        return fallback;
    }
}
function safeJsonStringify(value) {
    try {
        return JSON.stringify(value);
    }
    catch {
        return "";
    }
}
var sanitize_1 = require("./sanitize");
Object.defineProperty(exports, "sanitizeHTML", { enumerable: true, get: function () { return sanitize_1.sanitizeHTML; } });
