/**
 * HTML sanitization utility for BytePad
 * Can be used in both browser and Node.js environments
 */

// Browser environment - use DOMPurify
let DOMPurify: any = null;

if (typeof window !== "undefined") {
  // Browser: use DOMPurify directly
  try {
    DOMPurify = require("dompurify");
  } catch {
    // DOMPurify not available, will use fallback
  }
} else {
  // Node.js: use isomorphic-dompurify
  try {
    DOMPurify = require("isomorphic-dompurify");
  } catch {
    // Not available, will use fallback
  }
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  if (!html) return "";

  if (DOMPurify) {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "u",
        "s",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "blockquote",
        "code",
        "pre",
        "div",
        "span",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
      ALLOW_DATA_ATTR: false,
    });
  }

  // Fallback: basic HTML entity encoding (not as secure, but better than nothing)
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

