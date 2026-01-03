/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {useUIStore} from '@/lib/state'
import {useState} from 'react'
import {ImageOverlay} from '.'
import {LazyVideoPlayer} from './lazy-video-player'
import {Asset} from './types/post'

interface MediaGalleryProps {
    assets: Asset[]
    truncate?: boolean
}

export default function MediaGallery({assets, truncate = true}: MediaGalleryProps) {
    const bucketRoot = useUIStore(state => state.bucketRoot)
    const [overlayOpen, setOverlayOpen] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const openImageOverlay = (index: number) => {
        setCurrentImageIndex(index)
        setOverlayOpen(true)
    }

    // Determine how many assets to show in the gallery preview
    const visibleAssets = truncate ? assets.slice(0, 4) : assets
    const hasMore = truncate && assets.length > 4
    const remainingCount = assets.length - 4

    // Determine layout based on number of visible assets
    const getGridClassName = () => {
        if (visibleAssets.length === 1) return ''
        if (visibleAssets.length === 2) return 'grid grid-cols-2 gap-1'
        if (visibleAssets.length === 3) return 'grid grid-cols-3 gap-1'
        return 'grid grid-cols-2 grid-rows-2 gap-1'
    }

    return (
        <>
            {/* Gallery preview */}
            <div className={getGridClassName()}>
                {visibleAssets.map((asset, index) => {
                    const isLastWithMore = hasMore && index === 3
                    const assetUrl = `${bucketRoot}/${asset.data.url}`

                    return (
                        <div
                            key={index}
                            className={`
                relative overflow-hidden rounded-md
                ${visibleAssets.length === 1 ? 'w-full' : 'aspect-square'}
              `}
                            onClick={e => {
                                e.stopPropagation()
                                openImageOverlay(index)
                            }}
                        >
                            {asset.type === 'image' ? (
                                <>
                                    <img
                                        src={assetUrl}
                                        alt=""
                                        className="h-full w-full object-cover transition-transform hover:scale-105"
                                        loading="lazy"
                                    />
                                    {isLastWithMore && (
                                        <div
                                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                                            <span className="text-lg font-medium text-white">+{remainingCount}</span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <LazyVideoPlayer
                                    src={assetUrl}
                                    className="h-full w-full object-cover"
                                    onClick={e => e.stopPropagation()}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Image overlay for zooming and panning */}
            {overlayOpen &&
                <ImageOverlay assets={assets} initialIndex={currentImageIndex} onClose={() => setOverlayOpen(false)}/>}
        </>
    )
}
