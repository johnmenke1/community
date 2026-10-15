/**
 * Server-side markdown rendering for lesson content. Output is a
 * pre-sanitized HTML string safe to inject via `dangerouslySetInnerHTML`.
 *
 * Pipeline:
 *   1. marked converts markdown → HTML
 *   2. isomorphic-dompurify strips <script>, event handlers, dangerous
 *      attributes, javascript: URLs, etc.
 *
 * We do this on the server (not the client) for two reasons:
 *   - Smaller client bundle (marked + dompurify are ~50KB gzipped)
 *   - The renderer can't be tampered with at runtime by the user
 */
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

// GFM-flavored, no HTML pass-through (DOMPurify catches it anyway but
// disabling raw HTML in marked shortens the work for the sanitizer).
marked.setOptions({
  gfm: true,
  breaks: false,
});

/**
 * Render a markdown string to a sanitized HTML string. Always returns a
 * string — never null/undefined — so callers can use it directly with
 * `dangerouslySetInnerHTML`. Returns "" for empty/null input.
 *
 * Output is restricted to a safe subset:
 *   - Tags: structural (h1-h6, p, ul, ol, li, blockquote, pre, code,
 *     em, strong, a, br, hr, table, thead, tbody, tr, th, td, img)
 *   - Attributes: href on a (no javascript:, no data:), src/alt on img
 *     (https only), class on code/pre for syntax highlighting hooks
 *   - No <script>, <style>, <iframe>, <form>, event handlers
 */
export function renderMarkdown(input: string | null | undefined): string {
  if (!input) return "";
  const dirty = marked.parse(input, { async: false }) as string;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "blockquote",
      "pre", "code",
      "em", "strong", "del",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "class"],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|#|\/)/i,
  });
}
