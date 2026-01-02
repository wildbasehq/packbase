/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { TrashIcon } from '@heroicons/react/20/solid'
import { motion, useAnimationControls } from 'motion/react'
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'

export type Asset = {
    id: string
    src: string
    type: 'image' | 'video'
    assetId?: string
    uploading?: boolean
}

export default function AssetUploadStack({ assets, setAssets }: {
    assets: Asset[];
    setAssets: Dispatch<SetStateAction<Asset[]>>
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [containerWidth, setContainerWidth] = useState<number>(0)

    useEffect(() => {
        const update = () => setContainerWidth(containerRef.current?.clientWidth || 0)
        update()
        const ro = new ResizeObserver(update)
        if (containerRef.current) ro.observe(containerRef.current)
        return () => ro.disconnect()
    }, [])

    const handleReorder = (id: string, toIndex: number) => {
        setAssets(prev => {
            const fromIndex = prev.findIndex(p => p.id === id)
            if (fromIndex === -1 || fromIndex === toIndex) return prev
            const next = prev.slice()
            const [moved] = next.splice(fromIndex, 1)
            next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, moved)
            return next
        })
    }

    const handleRemove = (id: string) => {
        setAssets(prev => prev.filter(p => p.id !== id))
    }

    return (
        <div ref={containerRef} className="relative w-full select-none">
            <div className="relative h-24">
                {assets?.map((asset, index) => (
                    <DraggableCard
                        key={asset.id}
                        id={asset.id}
                        index={index}
                        src={asset.src}
                        containerWidth={containerWidth}
                        total={assets?.length || 0}
                        onReorder={handleReorder}
                        onRemove={handleRemove}
                    />
                ))}
            </div>
        </div>
    )
}

function DraggableCard({
    id,
    index,
    src,
    containerWidth,
    total,
    onReorder,
    onRemove,
}: {
    id: string
    index: number
    src: string
    containerWidth: number
    total: number
    onReorder: (id: string, toIndex: number) => void
    onRemove?: (id: string) => void
}) {
    const [overThreshold, setOverThreshold] = useState<boolean>(false)
    const [isDragging, setIsDragging] = useState<boolean>(false)
    const controls = useAnimationControls()

    const baseRotate = useMemo(() => {
        const range = 12
        return Math.random() * range - range / 2
    }, [])

    const z = 10 + index
    const spacing = 24
    const left = spacing * index

    const threshold = Math.max(80, Math.floor((containerWidth || 0) * 0.2))

    // Start/stop a subtle "jiggle" animation when overThreshold toggles
    useEffect(() => {
        if (overThreshold) {
            controls.start({
                rotate: [baseRotate - 1.5, baseRotate + 1.5],
                transition: {
                    duration: 0.05,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatType: 'mirror',
                },
            })
        } else {
            // controls.stop()
            controls.start({ rotate: baseRotate })
        }
    }, [overThreshold, baseRotate, controls])

    return (
        <motion.div
            className="absolute top-2 h-20 w-24 rounded-lg border ring-1 ring-default shadow-sm bg-muted/50 overflow-hidden"
            style={{ zIndex: isDragging ? 999 : z, left, willChange: 'transform' }}
            initial={{ rotate: baseRotate, y: 0 }}
            whileHover={{ y: -6, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            layout
            drag
            dragMomentum={false}
            dragSnapToOrigin
            onDragStart={() => {
                setIsDragging(true)
            }}
            onDrag={(_, info) => {
                const dist = Math.abs(info.offset.x + info.offset.y)
                setOverThreshold(dist >= threshold)
            }}
            onDragEnd={(_, info) => {
                const dist = Math.abs(info.offset.x + info.offset.y)

                if (dist >= threshold && onRemove) {
                    onRemove(id)
                    return
                }

                setOverThreshold(false)
                setIsDragging(false)
                // Perform reorder on drag end to avoid duplicate visual artifacts during live drag
                const proposedIndex = Math.round((left + info.offset.x) / spacing)
                const clampedIndex = Math.max(0, Math.min(total - 1, proposedIndex))
                if (clampedIndex !== index) {
                    onReorder(id, clampedIndex)
                }
                controls.start({ y: 0, x: 0, transition: { type: 'spring', stiffness: 700, damping: 40 } })
            }}
            animate={controls}
        >
            {overThreshold && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-red-500/50">
                    <TrashIcon className="w-6 h-6 text-white" />
                </div>
            )}
            <div className="h-full w-full bg-sidebar">
                <img src={src} alt="Image" className="h-full w-full object-cover pointer-events-none" />
                <div className="h-full w-full grid place-items-center">
                    <div className="h-8 w-14 rounded-md bg-white/50 dark:bg-white/10" />
                </div>
            </div>
        </motion.div>
    )
}
