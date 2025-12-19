/**
 * Title Generation Utility
 *
 * Generates concise conversation titles from user messages.
 */

/**
 * Generates a concise title from a user message.
 * 
 * Rules:
 * - Maximum 50 characters
 * - Removes extra whitespace
 * - Capitalizes first letter
 * - Adds ellipsis if truncated
 * 
 * @param message - The user's first message
 * @returns A concise title for the conversation
 */
export function generateConversationTitle(message: string): string {
  // Clean up the message
  const cleaned = message
    .trim()
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n+/g, " "); // Replace newlines with spaces

  if (!cleaned) {
    return "New Conversation";
  }

  const maxLength = 50;

  // If message is short enough, use it as-is
  if (cleaned.length <= maxLength) {
    return capitalizeFirstLetter(cleaned);
  }

  // Truncate at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(" ");

  // If we found a space, truncate there; otherwise use the full truncated string
  const title =
    lastSpaceIndex > maxLength * 0.6 // Only use word boundary if it's not too short
      ? truncated.substring(0, lastSpaceIndex)
      : truncated;

  return capitalizeFirstLetter(title) + "...";
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

