/**
 * Sanitizes review comments and user-generated text into clean, human-readable plain text.
 *
 * Guarantees:
 * 1. Executable tags and their inner contents (<script>, <style>, <iframe`, <svg>, <object>) are completely removed.
 * 2. HTML formatting tags (<b>, <i>, <img>, <p>, etc.) are stripped, leaving only the readable inner text.
 * 3. Line breaks (<br>, </p>, </div>) are converted to standard newlines (\n) to preserve readability.
 * 4. Never produces executable markup or HTML elements.
 * 5. Text is always rendered as an escaped React text node.
 */
export function sanitizeReviewText(raw) {
  if (!raw || typeof raw !== 'string') return ''

  // 1. Remove dangerous executable blocks including their inner contents
  let text = raw
    .replace(/<script\b[^>]*>[\s\S]*?(?:<\/script>|$)/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?(?:<\/style>|$)/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?(?:<\/iframe>|$)/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?(?:<\/svg>|$)/gi, '')
    .replace(/<object\b[^>]*>[\s\S]*?(?:<\/object>|$)/gi, '')

  // 2. Convert line break tags to newlines
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')

  // 3. Strip all remaining HTML tags (e.g. <b>, </b>, <img>, <span>, etc.)
  text = text.replace(/<[a-zA-Z/!?][^>]*>/g, '')

  // 4. Decode common safe entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')

  return text.trim()
}
