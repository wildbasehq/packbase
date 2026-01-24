// src/lib/utils/date.ts
/**
 * Format a date string into a human-readable relative time format
 * e.g. "just now", "5m ago", "2h ago", "yesterday", etc.
 * Also supports future dates: "in 5m", "in 2h", "tomorrow", etc.
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diff = date.getTime() - now.getTime()
    const seconds = Math.floor(Math.abs(diff) / 1000)
    const isFuture = diff > 0

    // Invalid date
    if (isNaN(date.getTime())) {
        return 'invalid date'
    }

    // Less than 10 seconds
    if (seconds < 10) {
        return 'now'
    }

    // Less than a minute
    if (seconds < 60) {
        return `${seconds}s`
    }

    // Minutes (up to 60 minutes)
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) {
        return `${minutes}m`
    }

    // Hours (up to 24 hours)
    const hours = Math.floor(minutes / 60)
    if (hours < 24) {
        return `${hours}h`
    }

    // Days (up to 7 days)
    const days = Math.floor(hours / 24)
    if (days < 7) {
        if (days === 1) {
            return isFuture ? 'tomorrow' : 'yesterday'
        }
        return `${days}d`
    }

    // Weeks (up to 4 weeks)
    const weeks = Math.floor(days / 7)
    if (weeks < 4) {
        return `${weeks}w`
    }

    // More than a month - use formatted date
    const options: Intl.DateTimeFormatOptions = {
        year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined,
        month: 'short',
        day: 'numeric',
    }

    return date.toLocaleDateString(undefined, options)
}
