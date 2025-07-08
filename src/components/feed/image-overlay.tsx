/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

// src/components/feed/ImageOverlay.tsx
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeftIcon, ArrowRightIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useUIStore } from '@/lib/state'
import { Asset } from './types/post'

interface ImageOverlayProps {
    assets: Asset[]
    initialIndex: number
    onClose: () => void
}

export default function ImageOverlay({ assets, initialIndex, onClose }: ImageOverlayProps) {
    const bucketRoot = useUIStore(state => state.bucketRoot)
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [touchDistance, setTouchDistance] = useState<number | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)

    // Filter out video assets
    const imageAssets = assets.filter(asset => asset.type === 'image')
    const currentAsset = imageAssets[currentIndex]
    const assetUrl = `${bucketRoot}/${currentAsset?.data.url || ''}`

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'Escape':
                    onClose()
                    break
                case 'ArrowLeft':
                    navigatePrevious()
                    break
                case 'ArrowRight':
                    navigateNext()
                    break
                case '+':
                    handleZoomIn()
                    break
                case '-':
                    handleZoomOut()
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)

        // Lock body scroll
        document.body.style.overflow = 'hidden'

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
        }
    }, [currentIndex, imageAssets.length])

    // Navigation functions
    const navigateNext = () => {
        if (currentIndex < imageAssets.length - 1) {
            setCurrentIndex(currentIndex + 1)
            resetView()
        }
    }

    const navigatePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1)
            resetView()
        }
    }

    // Reset zoom and position when changing images
    const resetView = () => {
        setScale(1)
        setPosition({ x: 0, y: 0 })
    }

    // Zoom functions
    const handleZoomIn = () => {
        setScale(prev => Math.min(prev + 0.25, 3))
    }

    const handleZoomOut = () => {
        setScale(prev => {
            const newScale = Math.max(prev - 0.25, 0.5)

            // If zooming out to default, reset position too
            if (newScale === 1) {
                setPosition({ x: 0, y: 0 })
            }

            return newScale
        })
    }

    // Mouse event handlers for dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true)
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Touch event handlers for pinch zoom and dragging
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Calculate initial distance between two fingers for pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX
            const dy = e.touches[0].clientY - e.touches[1].clientY
            const distance = Math.sqrt(dx * dx + dy * dy)
            setTouchDistance(distance)
        } else if (scale > 1) {
            // Single touch for dragging
            setIsDragging(true)
            setDragStart({
                x: e.touches[0].clientX - position.x,
                y: e.touches[0].clientY - position.y,
            })
        }
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && touchDistance !== null) {
            // Pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX
            const dy = e.touches[0].clientY - e.touches[1].clientY
            const newDistance = Math.sqrt(dx * dx + dy * dy)

            const scaleFactor = newDistance / touchDistance
            const newScale = Math.min(Math.max(scale * scaleFactor, 0.5), 3)

            setScale(newScale)
            setTouchDistance(newDistance)
        } else if (isDragging && scale > 1) {
            // Dragging
            setPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y,
            })
            e.preventDefault()
        }
    }

    const handleTouchEnd = () => {
        setIsDragging(false)
        setTouchDistance(null)
    }

    // Double-click to zoom in/out
    const handleDoubleClick = (e: React.MouseEvent) => {
        if (scale === 1) {
            setScale(2)
            // Zoom to cursor position
            const rect = containerRef.current?.getBoundingClientRect()
            if (rect) {
                const x = e.clientX - rect.left - rect.width / 2
                const y = e.clientY - rect.top - rect.height / 2
                setPosition({ x: -x, y: -y })
            }
        } else {
            resetView()
        }
    }

    // Prevent accidental selection during dragging
    const handleDragStart = (e: React.DragEvent) => {
        e.preventDefault()
        return false
    }

    // Click overlay background to close
    const handleBackgroundClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose()
        }
    }

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 bg-opacity-90 backdrop-blur-sm"
            onClick={handleBackgroundClick}
        >
            <div className="absolute top-4 right-4 flex space-x-2">
                <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700"
                    disabled={scale <= 0.5}
                >
                    <MagnifyingGlassPlusIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700"
                    disabled={scale >= 3}
                >
                    <MagnifyingGlassMinusIcon className="h-5 w-5" />
                </button>
                <button onClick={onClose} className="p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700">
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            {/* Navigation buttons */}
            {currentIndex > 0 && (
                <button
                    onClick={e => {
                        e.stopPropagation()
                        navigatePrevious()
                    }}
                    className="absolute left-4 p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                </button>
            )}

            {currentIndex < imageAssets.length - 1 && (
                <button
                    onClick={e => {
                        e.stopPropagation()
                        navigateNext()
                    }}
                    className="absolute right-4 p-2 rounded-full bg-neutral-800 text-white hover:bg-neutral-700"
                >
                    <ArrowRightIcon className="h-5 w-5" />
                </button>
            )}

            {/* Image container */}
            <div
                ref={containerRef}
                className={`relative -z-[1] h-full w-full overflow-hidden ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDoubleClick={handleDoubleClick}
                onDragStart={handleDragStart}
            >
                <div
                    className="absolute left-1/2 top-1/2 transform transition-transform duration-200 ease-out"
                    style={{
                        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                        transformOrigin: 'center',
                    }}
                >
                    <img src={assetUrl} alt="" className="max-h-screen max-w-screen" draggable={false} />
                </div>
            </div>

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-neutral-800 bg-opacity-75 px-3 py-1 rounded-full text-white text-sm">
                {currentIndex + 1} / {imageAssets.length}
            </div>
        </div>,
        document.body
    )
}
