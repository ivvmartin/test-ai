import "server-only";

import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

/**
 * Converts markdown content to sanitized HTML
 *
 * Uses remark with GFM (GitHub Flavored Markdown) support
 * Automatically sanitizes content to prevent XSS
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark()
    .use(remarkGfm) // Support for tables, strikethrough, task lists, etc.
    .use(remarkHtml, { sanitize: true }) // Convert to HTML with sanitization
    .process(markdown);

  return result.toString();
}

/**
 * Escapes HTML special characters to prevent injection
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char] || char);
}
