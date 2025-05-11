// src/components/feed/FeedEmpty.tsx
import {InboxIcon} from '@heroicons/react/24/outline'
import {Text} from '@/components/shared/text'
import {FeedEmptyProps} from './types/feed'

/**
 * Empty state display when no posts are available
 */
export default function FeedEmpty({
                                      message = 'Oddly enough, there\'s nothing to show you here.'
                                  }: FeedEmptyProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
                <InboxIcon className="h-8 w-8 text-neutral-400"/>
            </div>
            <Text className="mt-4 text-center text-neutral-500 dark:text-neutral-400">
                {message}
            </Text>
        </div>
    )
}