/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Tooltip from '@/components/shared/tooltip'
import {useResourceStore, useUIStore} from '@/lib/state'
import {GlobeAsiaAustraliaIcon, MagnifyingGlassIcon, StarIcon} from '@heroicons/react/20/solid'
import {useLocation} from 'wouter'
import {useCallback, useEffect, useRef, useState} from "react"
import {NavbarItem, NavbarLabel} from "@/src/components";
import {SignedIn} from "@clerk/clerk-react";
import {cn} from "@/lib";

export default function PackSwitcher({onChange}: {
    onChange: (resource: any) => void
}) {
    const {currentResource, setCurrentResource, resources, resourceDefault} = useResourceStore()
    const {setLoading} = useUIStore()
    const [, navigate] = useLocation()
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const [hasLeftOverflow, setHasLeftOverflow] = useState(false)
    const [hasRightOverflow, setHasRightOverflow] = useState(false)

    const switchResource = (resource: any) => {
        setCurrentResource(resource)
        setLoading(true)
        navigate(`/p/${resource.slug}`)
        onChange(resource)
    }

    const updateOverflowShadows = useCallback(() => {
        const el = scrollRef.current
        if (!el) return

        const {scrollLeft, scrollWidth, clientWidth} = el
        const maxScrollLeft = scrollWidth - clientWidth

        // Small epsilon to avoid flicker due to fractional scroll values
        const epsilon = 1

        setHasLeftOverflow(scrollLeft > epsilon)
        setHasRightOverflow(scrollLeft < maxScrollLeft - epsilon)
    }, [])

    const handleHorizontalWheel = (event: React.WheelEvent<HTMLDivElement>) => {
        // If the user scrolls vertically with the wheel, move horizontally instead.
        if (event.deltaY !== 0) {
            event.preventDefault()
            const el = event.currentTarget
            el.scrollLeft += event.deltaY
            // After adjusting scrollLeft manually, update shadows
            window.requestAnimationFrame(updateOverflowShadows)
        }
    }

    const handleScroll = () => {
        updateOverflowShadows()
    }

    useEffect(() => {
        // Initialize on mount (and when layout changes)
        updateOverflowShadows()
        const handleResize = () => updateOverflowShadows()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [updateOverflowShadows])

    return (
        <div
            ref={scrollRef}
            className="w-full"
            onWheel={handleHorizontalWheel}
            onScroll={handleScroll}
        >
            <div className="inline-grid w-max grid-rows-3 grid-flow-col gap-2 auto-cols-max">
                <SignedIn>
                    {[...resources].map((pack, colIdx) => (
                        <NavbarItem
                            key={colIdx}
                            className={cn("flex w-2xs *:w-full", currentResource.id === pack.id && "ring-1 rounded ring-default bg-card")}
                            onClick={() => switchResource(pack)}
                        >
                            <img
                                data-slot="avatar"
                                className="rounded-sm shrink-0 w-6 h-6 border overflow-hidden"
                                src={pack.images?.avatar || '/img/default-avatar.png'}
                            />

                            <div className="flex flex-col -space-y-1 w-full relative">
                                <NavbarLabel>{pack.display_name}</NavbarLabel>
                                <NavbarLabel className="text-muted-foreground text-xs">
                                    @{pack.slug}
                                    {/*<TextTicker*/}
                                    {/*    texts={['Now in public alpha testing!', 'Invite Badge Event extended...', 'R18 content now allowed...', 'Click in for more...']}*/}
                                    {/*    interval={1500 + colIdx * Math.random() * 1000}/>*/}
                                </NavbarLabel>
                            </div>

                            {pack.id === resourceDefault?.id && (
                                <Tooltip
                                    delayDuration={1000}
                                    content="Default Pack">
                                    <StarIcon/>
                                </Tooltip>
                            )}

                            {pack.temporary && (
                                <Tooltip
                                    delayDuration={1000}
                                    content="From Search. Will disappear when navigating away.">
                                    <MagnifyingGlassIcon/>
                                </Tooltip>
                            )}

                            {/*<ChevronDownIcon/>*/}
                        </NavbarItem>
                    ))}

                    <NavbarItem
                        className="flex w-2xs *:w-full"
                        href="/p/new"
                        onClick={() => onChange({})}
                    >
                        <GlobeAsiaAustraliaIcon className="w-6 h-6"/>
                        <NavbarLabel className="text-muted-foreground group-hover:text-foreground">Explore / Create
                            Packs&hellip;</NavbarLabel>
                    </NavbarItem>
                </SignedIn>
            </div>

            {/* Left gradient (only when there's content to the left) */}
            {hasLeftOverflow && (
                <div
                    className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-linear-to-r from-muted to-transparent"
                />
            )}

            {/* Right gradient (only when there's content to the right) */}
            {hasRightOverflow && (
                <div
                    className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-linear-to-l from-muted to-transparent"
                />
            )}
        </div>
    )
}
