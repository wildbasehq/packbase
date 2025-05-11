// src/components/feed/FeedHeader.tsx
import {ViewColumnsIcon} from '@heroicons/react/24/outline'
import {Button} from '@/components/shared/experimental-button-rework'
import {FeedHeaderProps} from './types/feed'

/**
 * Header component for the feed with view controls and info
 */
export default function FeedHeader({onViewChange}: FeedHeaderProps) {
    return (
        <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-2">
                {/* Additional feed filters or options could go here */}
            </div>

            <Button
                outline
                onClick={onViewChange}
                className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
                <ViewColumnsIcon className="h-4 w-4"/>
                <span className="text-sm font-medium">View</span>
            </Button>
        </div>
    )
}