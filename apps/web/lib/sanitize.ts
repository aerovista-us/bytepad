/**
 * Sanitize HTML content to prevent XSS attacks
 * Browser-only: uses DOMPurify directly (no jsdom needed)
 */
let DOMPurify: any = null;

if (typeof window !== "undefined") {
  // Browser: use DOMPurify directly (no jsdom)
  DOMPurify = require("dompurify");
}

export function sanitizeHTML(html: string): string {
  if (!html) return "";
  
  if (DOMPurify) {
    // Browser: use DOMPurify directly
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

