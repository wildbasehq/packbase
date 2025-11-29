/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import Tooltip from '@/components/shared/tooltip'
import {useResourceStore, useUIStore, useUserAccountStore} from '@/lib/state'
import {ExclamationTriangleIcon, GlobeAsiaAustraliaIcon} from '@heroicons/react/20/solid'
import {useLocation} from 'wouter'
import {Activity, useCallback, useEffect, useRef, useState} from "react"
import {Heading, NavbarItem, NavbarLabel} from "@/src/components";
import {Text} from "@/components/shared/text.tsx";
import {SignedOut} from "@clerk/clerk-react";
import {Login} from "@/components/icons/plump/Login.tsx";
import {cn, isVisible} from "@/lib";

export default function PackSwitcher({onChange}: {
    onChange: (resource: any) => void
}) {
    const {currentResource, setCurrentResource, resources} = useResourceStore()
    const {resourceDefault, loading, setLoading} = useUIStore()
    const {user} = useUserAccountStore()
    const [, navigate] = useLocation()
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const [hasLeftOverflow, setHasLeftOverflow] = useState(false)
    const [hasRightOverflow, setHasRightOverflow] = useState(false)

    const switchResource = (resource: any) => {
        if (loading || currentResource.id === resource.id) {
            if (resource.slug === 'universe') navigate('/p/universe')
        }

        resource.is_owner = currentResource.owner_id === user?.id
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
            className="w-full overflow-x-auto py-4 overflow-y-hidden"
            onWheel={handleHorizontalWheel}
            onScroll={handleScroll}
        >
            <div className="inline-grid w-max grid-rows-3 grid-flow-col gap-2 auto-cols-max">
                <NavbarItem
                    className="flex w-2xs mx-4 [&>*]:w-full"
                    href="/p/new"
                    onClick={() => close()}
                >
                    <GlobeAsiaAustraliaIcon className="w-6 h-6"/>
                    <NavbarLabel className="text-muted-foreground group-hover:text-foreground">Explore / Create
                        Packs&hellip;</NavbarLabel>
                </NavbarItem>

                <SignedOut>
                    <NavbarItem
                        className="flex w-2xs mx-4 [&>*]:w-full"
                        href="/id/login"
                    >
                        <Login className="w-6 h-6"/>
                        <NavbarLabel className="text-muted-foreground group-hover:text-foreground">
                            Login&hellip;
                        </NavbarLabel>
                    </NavbarItem>

                    <Activity
                        mode={isVisible(import.meta.env.VITE_REIGSTRATION_TYPE === 'open' || !import.meta.env.VITE_REIGSTRATION_TYPE)}>
                        <NavbarItem
                            className="flex w-2xs mx-4 [&>*]:w-full"
                            href="/id/create"
                        >
                            <Login className="w-6 h-6"/>
                            <NavbarLabel className="text-muted-foreground group-hover:text-foreground">
                                Register&hellip;
                            </NavbarLabel>
                        </NavbarItem>
                    </Activity>

                    <Activity mode={isVisible(import.meta.env.VITE_REIGSTRATION_TYPE === 'waitlist')}>
                        <NavbarItem
                            className="flex w-2xs mx-4 [&>*]:w-full"
                            href="/id/waitlist"
                        >
                            <Login className="w-6 h-6"/>
                            <NavbarLabel className="text-muted-foreground group-hover:text-foreground">
                                Join the Waitlist&hellip;
                            </NavbarLabel>
                        </NavbarItem>
                    </Activity>

                    <Activity mode={isVisible(import.meta.env.VITE_REIGSTRATION_TYPE === 'closed')}>
                        <NavbarItem
                            className="flex w-2xs mx-4 [&>*]:w-full"
                            href="/p/new"
                            onClick={() => onChange({})}
                        >
                            <NavbarLabel className="text-muted-foreground group-hover:text-foreground">
                                Registration Closed.
                            </NavbarLabel>
                        </NavbarItem>
                    </Activity>
                </SignedOut>

                {resources.map((pack, colIdx) => (
                    <NavbarItem
                        key={colIdx}
                        className={cn("flex w-2xs mx-4 [&>*]:w-full", currentResource.id === pack.id && "ring-1 rounded ring-default bg-card")}
                        onClick={() => switchResource(pack)}
                    >
                        <img
                            data-slot="avatar"
                            className="rounded-sm w-6 h-6 border overflow-hidden"
                            src={pack.images?.avatar || '/img/default-avatar.png'}
                        />
                        <div className="flex flex-col -space-y-1 relative">
                            <NavbarLabel>{pack.display_name}</NavbarLabel>
                            <NavbarLabel className="text-muted-foreground text-xs">
                                @{pack.slug}
                                {/*<TextTicker*/}
                                {/*    texts={['Now in public alpha testing!', 'Invite Badge Event extended...', 'R18 content now allowed...', 'Click in for more...']}*/}
                                {/*    interval={1500 + colIdx * Math.random() * 1000}/>*/}
                            </NavbarLabel>
                        </div>
                        <Tooltip
                            content={
                                <>
                                    <Heading className="!text-sm">System fault precautions are in effect.</Heading>
                                    <Text className="!text-xs">
                                        Our content moderation system is currently having some issues.
                                        We've temporarily enabled stricter (but sensitive) filtering which
                                        may block valid content. We're extremely sorry. /rek.
                                    </Text>
                                </>
                            }>
                            <ExclamationTriangleIcon
                                data-hardcoded-reasoning="Rheo manages feature flags - can't change due to Rheo being down."
                                className="!fill-orange-500"/>
                        </Tooltip>
                        {/*<ChevronDownIcon/>*/}
                    </NavbarItem>
                ))}
            </div>
        </div>
    )
}
