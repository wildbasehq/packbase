import React from 'react'
import { BentoItem, BentoItemContent } from './bento-grid'
import { DocumentTextIcon, FolderIcon, LinkIcon, PhotoIcon, StarIcon } from '@heroicons/react/24/outline'

// Helper function to create icons with consistent styling
const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="w-8 h-8 flex items-center justify-center text-blue-500">{children}</div>
)

// Sample bento items for demonstration
export const sampleBentoItems: BentoItem[] = [
    {
        id: 'notes',
        title: 'Quick Notes',
        content: (
            <BentoItemContent
                icon={
                    <Icon>
                        <DocumentTextIcon className="w-6 h-6" />
                    </Icon>
                }
                description="Keep your important notes here for quick access."
            />
        ),
        x: 0,
        y: 0,
        w: 3,
        h: 2,
    },
    {
        id: 'images',
        title: 'Recent Images',
        content: (
            <BentoItemContent
                icon={
                    <Icon>
                        <PhotoIcon className="w-6 h-6" />
                    </Icon>
                }
                description="Your recently uploaded images will appear here."
            />
        ),
        x: 3,
        y: 0,
        w: 3,
        h: 2,
    },
    {
        id: 'favorites',
        title: 'Favorites',
        content: (
            <BentoItemContent
                icon={
                    <Icon>
                        <StarIcon className="w-6 h-6" />
                    </Icon>
                }
                description="Quick access to your favorite content."
            />
        ),
        x: 6,
        y: 0,
        w: 6,
        h: 2,
    },
    {
        id: 'folders',
        title: 'Folders',
        content: (
            <BentoItemContent
                icon={
                    <Icon>
                        <FolderIcon className="w-6 h-6" />
                    </Icon>
                }
                description="Organize your content in folders for easy access."
            />
        ),
        x: 0,
        y: 2,
        w: 4,
        h: 3,
    },
    {
        id: 'links',
        title: 'Saved Links',
        content: (
            <BentoItemContent
                icon={
                    <Icon>
                        <LinkIcon className="w-6 h-6" />
                    </Icon>
                }
                description="Bookmarks and links you've saved from around the web."
            />
        ),
        x: 4,
        y: 2,
        w: 8,
        h: 3,
    },
]

// Function to generate random bento items (useful for testing)
export const generateRandomBentoItems = (count: number = 5): BentoItem[] => {
    const items: BentoItem[] = []
    const icons = [
        <DocumentTextIcon className="w-6 h-6" key="doc" />,
        <PhotoIcon className="w-6 h-6" key="img" />,
        <StarIcon className="w-6 h-6" key="star" />,
        <FolderIcon className="w-6 h-6" key="folder" />,
        <LinkIcon className="w-6 h-6" key="link" />,
    ]

    const titles = ['Notes', 'Images', 'Favorites', 'Folders', 'Links', 'Documents', 'Projects', 'Tasks', 'Ideas', 'Bookmarks']

    const descriptions = [
        'Keep your important notes here for quick access.',
        'Your recently uploaded images will appear here.',
        'Quick access to your favorite content.',
        'Organize your content in folders for easy access.',
        "Bookmarks and links you've saved from around the web.",
        'Your important documents and files.',
        'Track your ongoing projects and their status.',
        'Manage your tasks and to-dos in one place.',
        'Capture your ideas before they slip away.',
        'Save interesting links for later reading.',
    ]

    for (let i = 0; i < count; i++) {
        const w = Math.floor(Math.random() * 4) + 2 // Width between 2-5
        const h = Math.floor(Math.random() * 2) + 2 // Height between 2-3

        items.push({
            id: `item-${i}`,
            title: titles[i % titles.length],
            content: <BentoItemContent icon={<Icon>{icons[i % icons.length]}</Icon>} description={descriptions[i % descriptions.length]} />,
            x: (i * 3) % 12, // Distribute across the 12-column grid
            y: Math.floor((i * 3) / 12) * 3, // New row every 4 items
            w,
            h,
        })
    }

    return items
}
