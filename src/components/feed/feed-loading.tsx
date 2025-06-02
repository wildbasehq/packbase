/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/feed-loading.tsx
import Card from '@/components/shared/card'
import { Text } from '@/components/shared/text'
import { FeedLoadingProps } from './types/feed'

/**
 * Loading indicator for the thread-based feed
 */
export default function FeedLoading({ message = 'Loading threads...', isMasonry = false }: FeedLoadingProps) {
    // Simple loading indicator for appending new posts
    if (!isMasonry) {
        return (
            <div className="py-4 text-center">
                <Card className="mx-auto inline-flex items-center gap-2 px-4 py-3">
                    <img
                        src="/img/dog-on-ship.gif"
                        alt="Loading animation"
                        className="h-8 w-8"
                        style={{
                            imageRendering: 'pixelated',
                        }}
                    />
                    <Text size="sm">{message}</Text>
                </Card>
            </div>
        )
    }

    // Initial loading state with skeleton threads
    return (
        <div className="max-w-2xl mx-auto px-4">
            <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {/* Loading animation card */}
                <div className="py-6 first:pt-0">
                    <div className="flex items-center gap-3">
                        <img
                            src="/img/dog-on-ship.gif"
                            alt="Loading animation"
                            className="h-12 w-12"
                            style={{
                                imageRendering: 'pixelated',
                            }}
                        />
                        <Text size="sm">{message}</Text>
                    </div>
                </div>

                {/* Generate skeleton thread posts */}
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="py-6 animate-pulse">
                        <div className="flex gap-3">
                            {/* Avatar skeleton */}
                            <div className="flex-shrink-0">
                                <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                            </div>

                            {/* Content skeleton */}
                            <div className="flex-1 space-y-3">
                                {/* Header */}
                                <div className="flex items-baseline gap-2">
                                    <div className="h-4 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
                                    <div className="h-3 w-16 rounded bg-neutral-200 dark:bg-neutral-800" />
                                    <div className="h-3 w-12 rounded bg-neutral-200 dark:bg-neutral-800" />
                                </div>

                                {/* Body */}
                                <div className="space-y-2">
                                    <div className="h-4 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
                                    <div className="h-4 w-5/6 rounded bg-neutral-200 dark:bg-neutral-800" />
                                    <div className="h-4 w-4/6 rounded bg-neutral-200 dark:bg-neutral-800" />
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <div className="h-5 w-12 rounded bg-neutral-200 dark:bg-neutral-800" />
                                    <div className="h-5 w-12 rounded bg-neutral-200 dark:bg-neutral-800" />
                                    <div className="h-5 w-12 rounded bg-neutral-200 dark:bg-neutral-800" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
