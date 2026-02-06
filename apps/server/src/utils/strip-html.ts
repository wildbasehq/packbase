/**
 * Strip HTML tags and entities from a string, collapse whitespace,
 * and optionally truncate with ellipsis.
 */
export function stripHtml(html: string | null | undefined, maxLength?: number): string {
    if (!html) return ''

    const stripped = html
        .replace(/<[^>]*>/g, '')   // strip HTML tags
        .replace(/&[^;]+;/g, ' ')  // strip HTML entities
        .replace(/\s+/g, ' ')      // collapse whitespace
        .trim()

    if (maxLength && stripped.length > maxLength) {
        return stripped.slice(0, maxLength - 3) + '...'
    }

    return stripped
}
