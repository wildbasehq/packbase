import React, { useState } from 'react'
import FolderCollectionIcon from '@/components/icons/folder-collection.tsx'
import { Heading, Text } from '@/components/shared/text.tsx'
import { BentoGrid } from '@/components/bento/bento-grid'
import { sampleBentoItems } from '@/components/bento/sample-items'

function EmptyState() {
    return (
        <div className="absolute flex justify-center items-center h-[calc(100vh-14rem)] top-14 lg:pl-18 w-full overflow-hidden grow">
            <div className="h-full flex items-center justify-center">
                <div className="w-full max-w-2xl">
                    <div className="flex flex-col items-center justify-center">
                        <div className="flex flex-col items-center justify-center max-w-xs text-center mb-4">
                            <FolderCollectionIcon className="h-24 mb-6" />
                            <Heading className="mb-2">You have no stuff yet</Heading>
                            <Text alt>
                                Your "stuff" is collections of content you've saved across Packbase or copy-and-pasted into here, and will
                                always have quick access to.
                            </Text>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function BentoContent() {
    const [items, setItems] = useState(sampleBentoItems)

    const handleLayoutChange = (layout: any) => {
        // Update the items with the new layout positions
        const updatedItems = items.map(item => {
            const layoutItem = layout.find((l: any) => l.i === item.id)
            if (layoutItem) {
                return {
                    ...item,
                    x: layoutItem.x,
                    y: layoutItem.y,
                    w: layoutItem.w,
                    h: layoutItem.h,
                }
            }
            return item
        })

        setItems(updatedItems)
    }

    const addNewItem = () => {
        // Create a new item with a unique ID
        const newItem = {
            id: `item-${Date.now()}`,
            title: 'New Item',
            content: (
                <div className="flex flex-col h-full">
                    <Text>Items are automatically arranged. You can resize this item using the bottom-right corner.</Text>
                </div>
            ),
            x: 0, // Position will be determined by the grid's compactType
            y: 0, // Position will be determined by the grid's compactType
            w: 4, // Half width
            h: 2, // Standard height
        }

        setItems([...items, newItem])
    }

    const handleRemoveItem = (id: string) => {
        // Remove the item with the specified ID
        setItems(items.filter(item => item.id !== id))
    }

    return (
        <div className="absolute h-[calc(100vh-14rem)] w-full top-14 lg:pl-18 overflow-auto">
            <div className="p-4">
                <BentoGrid items={items} onLayoutChange={handleLayoutChange} onRemoveItem={handleRemoveItem} />
            </div>
        </div>
    )
}

export default function YourStuffPage() {
    // State to track if the user has content
    const [hasContent, setHasContent] = useState(false)

    const handleGetStarted = () => {
        setHasContent(true)
    }

    return hasContent ? <BentoContent /> : <EmptyState />
}
