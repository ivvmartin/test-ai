export function generateConversationTitle(message: string): string {
  const cleaned = message.trim().replace(/\s+/g, " ").replace(/\n+/g, " ");

  if (!cleaned) {
    return "New Conversation";
  }

  const maxLength = 50;

  if (cleaned.length <= maxLength) {
    return capitalizeFirstLetter(cleaned);
  }

  const truncated = cleaned.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(" ");

  const title =
    lastSpaceIndex > maxLength * 0.6
      ? truncated.substring(0, lastSpaceIndex)
      : truncated;

  return capitalizeFirstLetter(title) + "...";
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
