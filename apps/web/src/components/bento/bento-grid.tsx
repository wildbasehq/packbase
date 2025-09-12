import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { cn } from '@/lib/utils'
import { Heading, Text } from '@/components/shared/text'

// Define types for our bento items
export interface BentoItem {
    id: string
    title: string
    content: React.ReactNode
    color?: string
    x: number
    y: number
    w: number
    h: number
}

interface BentoGridProps {
    items: BentoItem[]
    onLayoutChange?: (layout: any) => void
    onRemoveItem?: (id: string) => void
    className?: string
}

export const BentoGrid: React.FC<BentoGridProps> = ({ items, onLayoutChange, onRemoveItem, className }) => {
    // Convert items to layout format required by GridLayout
    const layout = items.map(item => ({
        i: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
    }))

    // State to track if an item is being dragged or resized
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [activeItemId, setActiveItemId] = useState<string | null>(null)

    // State to track container width for responsive behavior
    const [containerWidth, setContainerWidth] = useState(1200)
    const containerRef = useRef<HTMLDivElement>(null)

    // Update container width on resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth)
            }
        }

        // Initial width
        updateWidth()

        // Add resize listener
        window.addEventListener('resize', updateWidth)

        // Cleanup
        return () => window.removeEventListener('resize', updateWidth)
    }, [])

    // Handle layout changes
    const handleLayoutChange = (newLayout: any) => {
        // With compactType="vertical" and preventCollision=false,
        // the grid will automatically handle item placement
        if (onLayoutChange) {
            onLayoutChange(newLayout)
        }
    }

    // Add effect to ensure placeholder styling is applied with Tailwind classes
    useEffect(() => {
        // This effect runs when dragging or resizing starts/stops
        if (isDragging || isResizing) {
            // Small delay to ensure the placeholder is in the DOM
            const timer = setTimeout(() => {
                // Find all placeholder elements and ensure they have our custom styling
                const placeholders = document.querySelectorAll('.react-grid-item.react-grid-placeholder')
                placeholders.forEach(placeholder => {
                    // Make sure the placeholder has our custom styling
                    if (placeholder instanceof HTMLElement) {
                        // Add Tailwind classes
                        placeholder.classList.add(
                            '!bg-muted-foreground/25',
                            'shadow-inner',
                            'shadow-n-9/25',
                            'duration-200',
                            'ease-out',
                            'border-4',
                            'border-dashed',
                            'border-black/30',
                            'rounded-xl',
                            'opacity-100',
                            'relative'
                        )

                        if (!placeholder.querySelector('.placeholder-after')) {
                            const after = document.createElement('div')
                            after.className = 'placeholder-after absolute w-full h-full pointer-events-none rounded-xl border-black/50'
                            placeholder.appendChild(after)
                        }
                    }
                })
            }, 0)

            return () => clearTimeout(timer)
        }
    }, [isDragging, isResizing])

    return (
        <div ref={containerRef} className={cn('bento-grid-container w-full h-full p-4', className)}>
            {/* Apply Tailwind classes to GridLayout */}
            <div className="grid-layout-styles">
                <GridLayout
                    className={cn(
                        'relative transition-[height] duration-200 ease-[ease]' // .react-grid-layout
                    )}
                    layout={layout}
                    cols={12}
                    rowHeight={60}
                    width={containerWidth}
                    margin={[16, 16]}
                    containerPadding={[0, 0]}
                    onDragStart={() => setIsDragging(true)}
                    onDragStop={() => setIsDragging(false)}
                    onResizeStart={() => setIsResizing(true)}
                    onResizeStop={() => setIsResizing(false)}
                    onLayoutChange={handleLayoutChange}
                    draggableHandle=".bento-item-drag-handle"
                    isResizable={true} // Enable resizing of grid items
                    resizeHandles={['se']}
                    // resizeHandle={'.react-resizable-handle'} // Specify the CSS class for resize handles
                    isBounded={true} // Ensure items stay within the container
                    compactType="vertical" // Enable automatic vertical compacting for structured layout
                    preventCollision={false} // Prevent items from overlapping
                >
                    {items.map(item => (
                        <div
                            key={item.id}
                            data-resizing={isResizing}
                            data-dragging={isDragging}
                            className={cn(
                                'transition-all duration-200 ease-[ease]', // .react-grid-item
                                'group', // For targeting child elements with group-* utilities
                                // Additional classes for different states
                                'data-[resizing=true]:transition-none data-[resizing=true]:z-[1]', // .react-grid-item.resizing
                                'data-[dragging=true]:transition-none data-[dragging=true]:z-[3]', // .react-grid-item.react-draggable-dragging
                                'data-[dropping=true]:invisible', // .react-grid-item.dropping
                                'relative' // Ensure positioning context for absolute elements
                            )}
                        >
                            <motion.div
                                className={cn(
                                    'h-full w-full rounded-xl p-4 pb-6 pr-6',
                                    'border border-zinc-200 dark:border-zinc-800',
                                    'bg-white dark:bg-zinc-900',
                                    'shadow-sm hover:shadow-md transition-shadow',
                                    item.color
                                )}
                                whileHover={{ scale: isDragging ? 1 : 1.02 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="bento-item-drag-handle flex-1 h-8 cursor-move flex items-center">
                                        <Heading size="md" className="truncate">
                                            {item.title}
                                        </Heading>
                                    </div>
                                    {onRemoveItem && (
                                        <motion.button
                                            className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-red-500"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={e => {
                                                e.stopPropagation()
                                                onRemoveItem(item.id)
                                            }}
                                            aria-label="Remove item"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </motion.button>
                                    )}
                                </div>
                                <div>{item.content}</div>
                            </motion.div>

                            {/* Resizable handle styles with Tailwind */}
                            {/*<div className="react-resizable-handle react-resizable-handle-se absolute bottom-0 right-0 w-10 h-10 cursor-se-resize z-10 hover:bg-black/5 dark:hover:bg-white/5 rounded-br-xl transition-colors duration-200">*/}
                            {/*    <div className="absolute right-[5px] bottom-[5px] w-[10px] h-[10px] border-r-2 border-b-2 border-black/60 dark:border-white/60 pointer-events-none"></div>*/}
                            {/*</div>*/}
                        </div>
                    ))}
                </GridLayout>
            </div>
        </div>
    )
}

// Create a sample bento item component
export const BentoItemContent: React.FC<{
    title?: string
    description?: string
    icon?: React.ReactNode
    className?: string
}> = ({ title, description, icon, className }) => {
    return (
        <div className={cn('flex flex-col h-full', className)}>
            {icon && <div className="mb-2">{icon}</div>}
            {title && (
                <Heading size="sm" className="mb-1">
                    {title}
                </Heading>
            )}
            {description && <Text alt>{description}</Text>}
        </div>
    )
}
