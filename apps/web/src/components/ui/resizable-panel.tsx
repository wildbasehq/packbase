// `apps/web/src/components/ui/resizable-panel.tsx`
import React, {ReactNode, useCallback, useEffect, useRef, useState} from 'react'

interface ResizableProps {
    direction?: 'horizontal' | 'vertical'
    initialSize?: number // Percentage (0-100) of the first panel
    minSize?: number // Minimum percentage
    maxSize?: number // Maximum percentage
    snapThreshold?: number // Percentage distance from initialSize to snap
    children: [ReactNode, ReactNode]
    className?: string
    onResizeEnd?: (size: number) => void
}

export function Resizable({
                              direction = 'horizontal',
                              initialSize = 50,
                              minSize = 10,
                              maxSize = 90,
                              snapThreshold = 1,
                              children,
                              className = '',
                              onResizeEnd,
                          }: ResizableProps) {
    const [size, setSize] = useState(initialSize)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const moveRemainderRef = useRef<number>(0)

    useEffect(() => {
        setSize(initialSize)
    }, [initialSize])

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        moveRemainderRef.current = 0
        setIsDragging(true)
    }

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault()
        moveRemainderRef.current = 0
        setIsDragging(true)
    }

    const handleMove = useCallback(
        (clientX: number, clientY: number) => {
            if (!containerRef.current) return

            const rect = containerRef.current.getBoundingClientRect()

            const rawPercent =
                direction === 'horizontal'
                    ? ((clientX - rect.left) / rect.width) * 100
                    : ((clientY - rect.top) / rect.height) * 100

            const clamped = Math.max(minSize, Math.min(maxSize, rawPercent))

            const snapped =
                Math.abs(clamped - initialSize) <= snapThreshold
                    ? Math.max(minSize, Math.min(maxSize, initialSize))
                    : clamped

            setSize(snapped)
        },
        [direction, initialSize, maxSize, minSize, snapThreshold]
    )

    const onMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging) return
            handleMove(e.clientX, e.clientY)
        },
        [isDragging, handleMove]
    )

    const onTouchMove = useCallback(
        (e: TouchEvent) => {
            if (!isDragging) return
            const t = e.touches[0]
            if (!t) return
            handleMove(t.clientX, t.clientY)
        },
        [isDragging, handleMove]
    )

    const onMouseUp = useCallback(() => {
        if (!isDragging) return
        onResizeEnd?.(size)
        setIsDragging(false)
    }, [isDragging, onResizeEnd, size])

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove)
            window.addEventListener('mouseup', onMouseUp)
            window.addEventListener('touchmove', onTouchMove, {passive: false})
            window.addEventListener('touchend', onMouseUp)
        } else {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('touchmove', onTouchMove)
            window.removeEventListener('touchend', onMouseUp)
        }
    }, [isDragging, onMouseMove, onMouseUp, onTouchMove])

    return (
        <div
            ref={containerRef}
            className={`flex ${direction === 'horizontal' ? 'flex-row' : 'flex-col'} w-full h-full ${className}`}
        >
            <div style={{flex: `0 0 ${size}%`}} className="relative overflow-auto">
                {children[0]}
            </div>

            <div
                className={`flex items-center justify-center bg-transparent z-10 hover:bg-gray-400/50 transition-colors ${
                    direction === 'horizontal'
                        ? 'w-1 cursor-col-resize h-full min-w-[4px]'
                        : 'h-1 cursor-row-resize w-full min-h-[4px]'
                }`}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            />

            <div className="flex-1 overflow-auto relative">{children[1]}</div>
        </div>
    )
}
