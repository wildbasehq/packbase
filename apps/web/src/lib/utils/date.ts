// src/lib/utils/date.ts
/**
 * Format a date string into a human-readable relative time format
 * e.g. "just now", "5m ago", "2h ago", "yesterday", etc.
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    // Invalid date
    if (isNaN(date.getTime())) {
        return 'invalid date'
    }

    // Less than 10 seconds ago
    if (seconds < 10) {
        return 'just now'
    }

    // Less than a minute ago
    if (seconds < 60) {
        return `${seconds}s ago`
    }

    // Minutes ago (up to 60 minutes)
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
        return `${minutes}m ago`
    }

    // Hours ago (up to 24 hours)
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
        return `${hours}h ago`
    }

    // Days ago (up to 7 days)
    const days = Math.floor(hours / 24)
    if (days < 7) {
        return days === 1 ? 'yesterday' : `${days}d ago`
    }

    // Weeks ago (up to 4 weeks)
    const weeks = Math.floor(days / 7)
    if (weeks < 4) {
        return `${weeks}w ago`
    }

    // More than a month ago - use formatted date
    const options: Intl.DateTimeFormatOptions = {
        year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
        month: 'short',
        day: 'numeric',
    }

    return date.toLocaleDateString(undefined, options)
}
