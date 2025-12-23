/**
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 *
 * This component is used to display the reaction stack, similar to Discord/Slack.
 * It is used in components that have an API /react endpoint (i.e. Howls).
 */

import Popover from '@/components/shared/popover'
import {EmojiPicker, EmojiPickerContent, EmojiPickerFooter, EmojiPickerSearch} from '@/src/components/ui/emoji-picker'
import {vg} from '@/src/lib'
import {cn} from '@/src/lib/utils'
import {FaceSmileIcon} from '@heroicons/react/20/solid'
import {CSSProperties, ReactNode, useCallback, useState} from 'react'

/**
 * Represents a single reaction with its metadata
 */
export type Reaction = {
    key: string // unique per emoji (e.g., ":thumbs_up:", or the emoji itself)
    emoji: string // actual emoji character
    count: number // total reactions
    reactedByMe?: boolean // if current user has reacted
}

/**
 * Props for the ClientReactionStack component
 */
export type ClientReactionStackProps = {
    reactions: Reaction[]
    onToggle?: (key: string, nextReacted: boolean) => Promise<void> | void
    onAdd?: (emoji: { emoji: string; label?: string } | string) => Promise<void> | void
    allowAdd?: boolean // show "+" button and picker
    showPicker?: boolean // control picker visibility externally (optional)
    defaultShowPicker?: boolean // uncontrolled picker visibility
    maxVisible?: number // collapse after N
    size?: 'sm' | 'md'
    disabled?: boolean
    className?: string
    renderPill?: (reaction: Reaction) => ReactNode // optional custom rendering
}

/**
 * Client-side reaction stack component that renders reaction pills with counts,
 * supports toggling, overflow handling, and optional emoji picker integration.
 *
 * @example
 * ```tsx
 * <ClientReactionStack
 *   reactions={[
 *     { key: "👍", emoji: "👍", count: 5, reactedByMe: true },
 *     { key: "❤️", emoji: "❤️", count: 3, reactedByMe: false }
 *   ]}
 *   onToggle={(key, reacted) => console.log(`${key}: ${reacted}`)}
 *   onAdd={(emoji) => console.log("Added:", emoji)}
 *   allowAdd={true}
 *   maxVisible={3}
 * />
 * ```
 */
export function ClientReactionStack({
                                        reactions,
                                        onToggle,
                                        onAdd,
                                        allowAdd = false,
                                        showPicker,
                                        defaultShowPicker = false,
                                        maxVisible = 5,
                                        size = 'md',
                                        disabled = false,
                                        className,
                                        renderPill,
                                    }: ClientReactionStackProps) {
    const [internalShowPicker, setInternalShowPicker] = useState(defaultShowPicker)
    const [expanded, setExpanded] = useState(false)

    const isPickerVisible = showPicker !== undefined ? showPicker : internalShowPicker

    const sizeClasses = {
        sm: 'h-6 px-1 text-xs',
        md: 'h-7 px-2 text-xs',
    }

    const visibleReactions = expanded ? reactions : reactions.slice(0, maxVisible)
    const hasOverflow = reactions.length > maxVisible

    const handleToggle = useCallback(
        async (reaction: Reaction) => {
            if (disabled || !onToggle) return

            try {
                await onToggle(reaction.key, !reaction.reactedByMe)
            } catch (error) {
                console.error('Failed to toggle reaction:', error)
            }
        },
        [disabled, onToggle]
    )

    const handleAddEmoji = useCallback(
        async (emoji: { emoji: string; label?: string } | string) => {
            if (disabled || !onAdd) return

            try {
                await onAdd(emoji)
                setInternalShowPicker(false)
            } catch (error) {
                console.error('Failed to add reaction:', error)
            }
        },
        [disabled, onAdd]
    )

    const togglePicker = useCallback(() => {
        if (disabled) return
        setInternalShowPicker(!isPickerVisible)
    }, [disabled, isPickerVisible])

    const defaultRenderPill = useCallback(
        (reaction: Reaction) => (
            <button
                key={reaction.key}
                onClick={() => handleToggle(reaction)}
                disabled={disabled}
                aria-pressed={reaction.reactedByMe}
                className={cn(
                    'relative inline-flex items-center gap-1 z-10 rounded-md border px-2 text-xs overflow-hidden',
                    'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'before:absolute before:inset-0 before:-z-1 before:hidden before:items-center before:justify-center before:text-[2.5em] before:scale-300 before:blur-lg before:saturate-200 before:opacity-50 before:content-(--emoji) aria-pressed:before:flex',
                    sizeClasses[size],
                    className
                )}
                style={
                    {
                        '--emoji': `"${reaction.emoji}"`,
                    } as CSSProperties
                }
            >
                <span className="text-base">{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
            </button>
        ),
        [handleToggle, disabled, size, sizeClasses, className]
    )

    return (
        <div className={cn('flex flex-wrap items-center gap-1', className)}>
            {/* Reaction Pills */}
            {visibleReactions.map(reaction => (renderPill ? renderPill(reaction) : defaultRenderPill(reaction)))}

            {/* Overflow Toggle */}
            {hasOverflow && (
                <button
                    onClick={() => setExpanded(!expanded)}
                    disabled={disabled}
                    className={cn(
                        'inline-flex items-center gap-1 rounded-md border bg-muted px-2 text-xs',
                        'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        sizeClasses[size]
                    )}
                >
                    <span
                        className="text-muted-foreground">{expanded ? '−' : `+${reactions.length - maxVisible}`}</span>
                </button>
            )}

            {/* Add Reaction Button */}
            {allowAdd && (
                <div className="relative">
                    <Popover content={<>
                        <div className="z-50">
                            <div className="rounded-md bg-sidebar shadow-lg">
                                <EmojiPicker onEmojiSelect={handleAddEmoji}>
                                    <EmojiPickerSearch placeholder="Search emoji"/>
                                    <EmojiPickerContent/>
                                    <EmojiPickerFooter/>
                                </EmojiPicker>
                            </div>
                        </div>
                    </>}>
                        <button
                            disabled={disabled}
                            className={cn(
                                'inline-flex items-center justify-center rounded-md border bg-muted text-xs',
                                'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                'disabled:opacity-50 disabled:cursor-not-allowed',
                                sizeClasses[size],
                                visibleReactions.length === 0 && 'aria-[expanded=false]:hidden group-hover:inline-flex!',
                            )}
                            aria-label="Add reaction"
                        >
                            <FaceSmileIcon className="w-4 h-4 text-muted-foreground"/>
                        </button>
                    </Popover>
                </div>
            )}
        </div>
    )
}

/**
 * Props for the ServerReactionStack component
 */
export type ServerReactionStackProps = {
    entityId: string
    endpoint?: string
    initialReactions?: Reaction[]
    max?: number // server-side max reactions limit
} & Omit<ClientReactionStackProps, 'reactions'>

/**
 * Server-side reaction stack wrapper that handles API calls.
 * Currently a dummy implementation that logs actions and manages local state.
 *
 * @example
 * ```tsx
 * <ServerReactionStack
 *   entityId="post-123"
 *   endpoint="/api/reactions"
 *   initialReactions={[]}
 *   allowAdd={true}
 *   maxVisible={5}
 * />
 * ```
 */
export function ServerReactionStack({
                                        entityId,
                                        endpoint = '/howl/{entityId}/react',
                                        initialReactions = [],
                                        max,
                                        ...clientProps
                                    }: ServerReactionStackProps) {
    const [reactions, setReactions] = useState<Reaction[]>(initialReactions)
    const [loading, setLoading] = useState(false)

    const handleToggle = useCallback(
        async (key: string, nextReacted: boolean) => {
            setLoading(true)

            try {
                // Optimistic update
                setReactions(prev =>
                    prev
                        .map(r => (r.key === key ? {
                            ...r,
                            reactedByMe: nextReacted,
                            count: r.count + (nextReacted ? 1 : -1)
                        } : r))
                        .filter(r => r.count > 0)
                )

                // Log the action (dummy implementation)
                console.info(`[ServerReactionStack] Toggle reaction:`, {
                    entityId,
                    key,
                    nextReacted,
                    endpoint,
                })

                const action = nextReacted ? vg.howl({id: entityId}).react.post : vg.howl({id: entityId}).react.delete

                const {error} = await action({slot: key})
                if (error) {
                    console.error('Failed to toggle reaction:', error)
                    throw error
                }
            } catch (error) {
                console.error('Failed to toggle reaction:', error)
                // Revert optimistic update on error
                setReactions(prev =>
                    prev.map(r => (r.key === key ? {
                        ...r,
                        reactedByMe: !nextReacted,
                        count: r.count + (nextReacted ? -1 : 1)
                    } : r))
                )
            } finally {
                setLoading(false)
            }
        },
        [entityId, endpoint]
    )

    const handleAdd = useCallback(
        async (emoji: { emoji: string; label?: string } | string) => {
            setLoading(true)

            try {
                const emojiStr = typeof emoji === 'string' ? emoji : emoji.emoji
                const key = emojiStr

                // Check if reaction already exists
                const existingReaction = reactions.find(r => r.key === key)

                if (existingReaction) {
                    // Toggle existing reaction
                    await handleToggle(key, !existingReaction.reactedByMe)
                    return
                }

                // Check max limit
                if (max && reactions.length >= max) {
                    console.warn(`[ServerReactionStack] Max reactions limit reached: ${max}`)
                    return
                }

                // Add new reaction
                const newReaction: Reaction = {
                    key,
                    emoji: emojiStr,
                    count: 1,
                    reactedByMe: true,
                }

                setReactions(prev => [...prev, newReaction])

                // Log the action (dummy implementation)
                console.info(`[ServerReactionStack] Add reaction:`, {
                    entityId,
                    emoji: emojiStr,
                    endpoint,
                })

                const {error} = await vg.howl({id: entityId}).react.post({slot: key})
                if (error) {
                    console.error('Failed to add reaction:', error)
                    throw error
                }
            } catch (error) {
                console.error('Failed to add reaction:', error)
            } finally {
                setLoading(false)
            }
        },
        [reactions, max, entityId, endpoint, handleToggle]
    )

    return <ClientReactionStack {...clientProps} reactions={reactions} onToggle={handleToggle} onAdd={handleAdd}
                                disabled={loading}/>
}
