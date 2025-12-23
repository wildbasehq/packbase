import {HTTPError} from '@/lib/HTTPError'

/**
 * Sanitizes and validates an array of tags
 * - Tags are trimmed
 * - Tags must only contain letters, digits, underscores, and optionally balanced parentheses
 * - Brackets must be closed and only appear once at the end of the string
 *
 * @param tags - Array of tag strings to sanitize
 * @returns Array of sanitized tags
 * @throws HTTPError if any tag is invalid
 */
export default function sanitizeTags(tags: string[]): string[] {
    const sanitizedTags: string[] = []

    for (const tag of tags) {
        const trimmedTag = tag.trim()

        // Check if tag matches allowed pattern:
        // - alphanumeric, underscores, and optional (text) at the end
        // - brackets must be balanced and only appear once at the end
        const validPattern = /^[\w]+(\([\w\s]+\))?$/

        if (!validPattern.test(trimmedTag)) {
            throw HTTPError.badRequest({
                summary: `Invalid tag format: "${trimmedTag}". Tags must only contain letters, digits, underscores, and optionally balanced parentheses at the end.`,
            })
        }

        // Ensure brackets only appear at the end (if at all)
        const bracketCheck = trimmedTag.match(/\(.*?\)/g)
        if (bracketCheck && bracketCheck.length > 1) {
            throw HTTPError.badRequest({
                summary: `Invalid tag format: "${trimmedTag}". Brackets can only appear once.`,
            })
        }

        // Ensure brackets are at the end
        if (trimmedTag.includes('(') && !trimmedTag.endsWith(')')) {
            throw HTTPError.badRequest({
                summary: `Invalid tag format: "${trimmedTag}". Brackets must be at the end and properly closed.`,
            })
        }

        sanitizedTags.push(trimmedTag)
    }

    return sanitizedTags
}
