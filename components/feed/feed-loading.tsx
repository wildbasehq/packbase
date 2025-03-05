// src/components/feed/FeedLoading.tsx
import Masonry, {ResponsiveMasonry} from 'react-responsive-masonry'
import Card from '@/components/shared/card'
import {Text} from '@/components/shared/text'
import {FeedLoadingProps} from './types/feed'

/**
 * Loading indicator for the feed with shimmer effect
 */
export default function FeedLoading({
                                        message = 'Speeding through the howls...',
                                        isMasonry = false
                                    }: FeedLoadingProps) {
    // Simple loading indicator for when appending new posts
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

    // Masonry layout with shimmer effect for initial loading
    return (
        <ResponsiveMasonry columnsCountBreakPoints={{750: 1, 1080: 2, 1360: 3, 1640: 4}}>
            <Masonry className="list-stagger animate-pulse-stagger" gutter="24px">
                {/* Loading animation card */}
                <Card className="w-full overflow-hidden">
                    <div className="flex items-center gap-2">
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
                </Card>

                {/* Generate placeholder cards with different heights */}
                {Array.from({length: 24}).map((_, index) => (
                    <Card
                        key={index}
                        className="w-full overflow-hidden"
                        style={{
                            height: `${Math.floor(Math.random() * 160) + 120}px`,
                        }}
                    >
                        <div className="flex h-10 animate-pulse items-center space-x-2">
                            <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800"/>
                            <div className="space-y-2">
                                <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800"/>
                                <div className="h-3 w-10 rounded bg-neutral-200 dark:bg-neutral-800"/>
                            </div>
                        </div>
                    </Card>
                ))}
            </Masonry>
        </ResponsiveMasonry>
    )
}