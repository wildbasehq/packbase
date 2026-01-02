// src/components/feed/FeedViewControls.tsx
import {HelpCircleIcon} from 'lucide-react'
import {Button} from '@/components/shared/experimental-button-rework'
import Card from '@/components/shared/card'
import {Heading, Text} from '@/components/shared/text'
import SelectMenu from '@/components/shared/input/select-dropdown'
import WireframeGrid from '@/components/icons/wireframe-grid'
import WireframeList from '@/components/icons/wireframe-list'
import {FeedViewControlsProps, FeedViewOption} from './types/feed'

// Define available feed view options
const viewOptions: FeedViewOption[] = [
    {id: 1, name: 'Grid', icon: WireframeGrid},
    {id: 2, name: 'List', icon: WireframeList}
]

/**
 * Modal component for changing feed view settings
 */
export default function FeedViewControls({
                                             onClose,
                                             currentView,
                                             onViewChange
                                         }: FeedViewControlsProps) {
    const handleViewChange = (option: FeedViewOption) => {
        onViewChange(option.id)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="mx-4 max-w-md space-y-4 p-6 shadow-xl">
                <Heading size="lg" className="flex items-center gap-2">
                    <HelpCircleIcon className="h-5 w-5"/>
                    Feed View
                </Heading>

                <Text className="text-sm text-neutral-600 dark:text-neutral-400">
                    You can switch between different feed layouts. This may affect how some content
                    appears, such as comics or stories that were designed for a specific view.
                </Text>

                <div className="flex flex-col gap-4 pt-2">
                    <SelectMenu
                        title="View Style"
                        selected={viewOptions.find(option => option.id === currentView) || viewOptions[0]}
                        onChange={handleViewChange}
                        options={viewOptions}
                    />

                    <div className="flex justify-end">
                        <Button onClick={onClose} className="mt-2">
                            Done
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}