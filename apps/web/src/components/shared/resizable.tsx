/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {useCallback, useEffect, useRef} from 'react'
import {cn} from "@/lib";

type ResizablePanelProps = {
    children: React.ReactNode
    width: number
    onResize: (nextWidth: number) => void
    minWidth?: number
    maxWidth?: number
    className?: string
    handleClassName?: string
}

/**
 * ResizablePanel renders its children with a fixed width and exposes a right-edge drag handle
 * to resize horizontally between minWidth and maxWidth. State is controlled by the parent.
 */
export function ResizablePanel({
                                   children,
                                   width,
                                   onResize,
                                   minWidth = 240,
                                   maxWidth = 560,
                                   className,
                                   handleClassName,
                               }: ResizablePanelProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const draggingRef = useRef(false)

    const clamp = useCallback((w: number) => Math.max(minWidth, Math.min(maxWidth, Math.round(w))), [minWidth, maxWidth])

    const onMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!draggingRef.current || !containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const proposed = e.clientX - rect.left
            onResize(clamp(proposed))
            e.preventDefault()
        },
        [onResize, clamp]
    )

    const stopDragging = useCallback(() => {
        if (!draggingRef.current) return
        draggingRef.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
    }, [])

    const startDragging = useCallback((e: React.MouseEvent) => {
        draggingRef.current = true
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
        e.preventDefault()
    }, [])

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', stopDragging)
        window.addEventListener('mouseleave', stopDragging)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', stopDragging)
            window.removeEventListener('mouseleave', stopDragging)
        }
    }, [onMouseMove, stopDragging])

    return (
        <div ref={containerRef} className={cn('relative', className)} style={{width}}>
            {children}
            <div
                onMouseDown={startDragging}
                className={cn(
                    'absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent transition-[background-color] hover:bg-n-2/25',
                    handleClassName
                )}
                // style={{ paddingLeft: 6, paddingRight: 6 }}
                aria-label="Resize panel"
                role="separator"
                aria-orientation="vertical"
            />
        </div>
    )
}

export default ResizablePanel
