// src/components/feed/FeedError.tsx
import {ExclamationCircleIcon} from '@heroicons/react/24/outline'
import {Heading, Text} from '@/components/shared/text'
import {Button} from '@/components/shared'
import {FeedErrorProps} from './types/feed'

/**
 * Displays an error message when the feed fails to load
 */
export default function FeedError({error}: FeedErrorProps) {
    const handleRefresh = () => {
        window.location.reload()
    }

    return (
        <div className="flex flex-col items-center justify-center py-10">
            <div className="mx-auto max-w-lg text-center">
                <div
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                    <ExclamationCircleIcon className="h-8 w-8 text-red-500 dark:text-red-400"/>
                </div>

                <Heading size="lg" className="mb-2 text-neutral-800 dark:text-neutral-200">
                    Unable to load feed
                </Heading>

                <Text className="mb-6 text-neutral-600 dark:text-neutral-400">
                    {error.message || 'An unexpected error occurred while trying to load the feed.'}
                </Text>

                <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-3 sm:space-y-0">
                    <Button onClick={handleRefresh}>Try Again</Button>

                    <Button outline href="https://discord.gg/StuuK55gYA" target="_blank">
                        Get Help
                    </Button>
                </div>
            </div>
        </div>
    )
}
