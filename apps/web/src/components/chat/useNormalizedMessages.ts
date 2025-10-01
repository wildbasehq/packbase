import {useMemo} from 'react'

export interface Message {
    id: string
    channel_id: string
    author_id: string
    content: string
    message_type: string
    created_at: string
    edited_at: string | null
    deleted_at: string | null
    reply_to: string | null
    _isPending?: boolean
}

export interface MessageGroup {
    type: 'group'
    id: string
    authorId: string
    startAt: Date
    items: Message[]
}

export interface DayDivider {
    type: 'day'
    id: string
    label: string
}

export type GroupOrDivider = MessageGroup | DayDivider

export interface NormalizedMessages {
    byId: Record<string, Message>
    allIds: string[]
    groups: GroupOrDivider[]
}

export const useNormalizedMessages = (rawMessages: Message[]): NormalizedMessages => {
    return useMemo(() => {
        const byId: Record<string, Message> = {}
        const allIds: string[] = []

        // Normalize messages by ID for fast lookups
        rawMessages.forEach(msg => {
            byId[msg.id] = msg
            allIds.push(msg.id)
        })

        // Create grouped messages with day dividers
        const groups: GroupOrDivider[] = []
        const asc = [...rawMessages].reverse() // Oldest first for grouping
        const thresholdMs = 5 * 60 * 1000 // 5 minutes
        let lastDay: string | null = null

        const formatDay = (d: Date) => {
            const today = new Date()
            const yest = new Date()
            yest.setDate(today.getDate() - 1)

            const sameDay = (a: Date, b: Date) =>
                a.getFullYear() === b.getFullYear() &&
                a.getMonth() === b.getMonth() &&
                a.getDate() === b.getDate()

            if (sameDay(d, today)) return 'Today'
            if (sameDay(d, yest)) return 'Yesterday'
            return d.toLocaleDateString()
        }

        for (const message of asc) {
            const timestamp = new Date(message.created_at)
            const day = formatDay(timestamp)

            // Add day divider if day changed
            if (lastDay !== day) {
                groups.push({
                    type: 'day',
                    id: `day-${day}`,
                    label: day
                })
                lastDay = day
            }

            // Try to group with previous message group
            const lastGroup = groups[groups.length - 1]
            if (
                lastGroup &&
                lastGroup.type === 'group' &&
                lastGroup.authorId === message.author_id &&
                timestamp.getTime() - lastGroup.startAt.getTime() <= thresholdMs
            ) {
                lastGroup.items.push(message)
            } else {
                // Create new message group
                groups.push({
                    type: 'group',
                    id: `group-${message.id}`,
                    authorId: message.author_id,
                    startAt: timestamp,
                    items: [message],
                })
            }
        }

        return {byId, allIds, groups}
    }, [rawMessages])
}
