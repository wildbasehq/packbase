/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {cn} from '@/lib'
import {Play} from 'lucide-react'
import {MouseEvent, useRef, useState} from 'react'

interface LazyVideoPlayerProps {
    src: string
    className?: string
    onClick?: (e: MouseEvent) => void
}

export function LazyVideoPlayer({src, className, onClick}: LazyVideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    const handlePlayClick = (e: MouseEvent) => {
        e.stopPropagation()
        setIsPlaying(true)
        // Start playing after a small delay to ensure video is ready
        setTimeout(() => {
            videoRef.current?.play()
        }, 50)
    }

    return (
        <div
            className={cn(
                'group relative flex items-center justify-center overflow-hidden rounded-md',
                'cursor-pointer transition-all duration-200',
                className
            )}
            onClick={isPlaying ? undefined : handlePlayClick}
        >
            {/* Video element - always rendered with metadata preloaded to show first frame */}
            <video
                ref={videoRef}
                src={src}
                className={cn(
                    'h-full w-full object-cover rounded-md',
                    isPlaying && 'pointer-events-auto'
                )}
                preload="metadata"
                muted={!isPlaying}
                controls={isPlaying}
                playsInline
                onClick={e => {
                    if (isPlaying) {
                        e.stopPropagation()
                        onClick?.(e)
                    }
                }}
            />

            {/* Overlay and play button - only shown before playing */}
            {!isPlaying && (
                <>
                    {/* Overlay for hover effect */}
                    <div
                        className="pointer-events-none absolute inset-0 bg-card/0 transition-all duration-200 group-hover:bg-card/50"/>

                    {/* Play button overlay */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div
                            className={cn(
                                'flex items-center justify-center rounded-full',
                                'h-16 w-16',
                                'bg-card/80',
                                'shadow-lg backdrop-blur-sm',
                                'transition-all duration-200',
                                'group-hover:scale-105'
                            )}
                        >
                            <Play
                                className="ml-1 text-zinc-900 dark:text-white"
                                size={32}
                                fill="currentColor"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}


