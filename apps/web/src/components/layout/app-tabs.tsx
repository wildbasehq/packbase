/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {useEffect, useMemo, useState} from 'react'
import {AnimatePresence, motion, useMotionValue, useTransform} from 'motion/react'
import {animate} from 'motion'
import {cn, useResourceStore} from '@/lib'
import {Avatar} from "@/src/components";
import {Cog6ToothIcon} from "@heroicons/react/20/solid";
import {navigate} from "wouter/use-browser-location";

const SYSTEM_TABS = [
    {
        id: 'SYS0000',
        display_name: 'Account Settings',
        Icon: Cog6ToothIcon,
        slug: '/settings'
    }
]

export function AppTabs({className = ''}: { className?: string }) {
    const {resourceDefault, resources: resourcesFromStore} = useResourceStore()
    const resources = useMemo(() => [resourceDefault, ...resourcesFromStore, ...SYSTEM_TABS], [resourceDefault, resourcesFromStore])
    // Drag value for the sheet. 0 = collapsed, -EXPANDED = fully open
    const y = useMotionValue(0)

    // Track whether panel is open based on drag position
    const [isOpen, setIsOpen] = useState(false)
    useEffect(() => {
        const unsubscribe = y.on('change', (v) => {
            // Open when panel is pulled up even slightly
            setIsOpen(v < 0)
        })
        return () => {
            // @ts-ignore - framer-motion returns an unsubscribe function
            typeof unsubscribe === 'function' && unsubscribe()
        }
    }, [y])

    // Heights
    const BAR_H = 64 // px
    const EXPANDED = 320 // px the revealed panel height above the bar
    const SNAP_THRESHOLD = 0.35 // fraction to snap open/closed on release

    const dragConstraints = useMemo(() => ({top: -EXPANDED, bottom: 0}), [])

    // Derive backdrop opacity from y: 0 when closed (y=0), 1 when fully open (y=-EXPANDED)
    const backdropOpacity = useTransform(y, (v) => Math.min(1, Math.max(0, -v / EXPANDED)))
    // Fade out the bar content and slide it up as we drag
    const contentOpacity = useTransform(y, [0, -EXPANDED], [1, 0])
    const contentMargin = useTransform(y, [0, -EXPANDED], [0, -BAR_H])

    // Calculate dynamic height so the bottom of the container stays visually fixed
    // as we drag up. y is negative when dragging up, so -y is positive growth.
    const height = useTransform(y, (v) => `calc(${BAR_H}px + env(safe-area-inset-bottom) + ${-v}px)`)

    function snap(toOpen: boolean) {
        animate(y, toOpen ? -EXPANDED : 0, {
            type: 'spring',
            stiffness: 420,
            damping: 40,
            mass: 0.8,
        })
    }

    function onDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: {
        offset: { y: number },
        velocity: { y: number }
    }) {
        const current = y.get()
        // Decide based on position and velocity
        const progress = Math.abs(current) / EXPANDED // 0..1
        const goingUp = info.velocity.y < 0
        const shouldOpen = progress > SNAP_THRESHOLD ? true : goingUp
        snap(shouldOpen)
    }

    return (
        <div
            className={cn('sm:hidden fixed inset-x-0 bottom-0 z-50 mx-2 mb-2', className)}
            style={{height: `calc(${BAR_H}px + env(safe-area-inset-bottom))`}}
        >
            {/* Backdrop click to close when open */}
            <AnimatePresence>
                {isOpen && (
                    <motion.button
                        key="backdrop"
                        aria-label="Close tabs overlay"
                        className="fixed inset-0 bg-black/30"
                        style={{opacity: backdropOpacity}}
                        onClick={() => snap(false)}
                    />
                )}
            </AnimatePresence>

            {/* Draggable container that holds panel + bar */}
            <motion.div
                style={{y, height}}
                drag="y"
                dragConstraints={dragConstraints}
                dragElastic={0.2}
                onDragEnd={onDragEnd}
                className="relative rounded-2xl overflow-hidden bg-card px-3 ring-1 ring-default"
            >
                {/* Bottom bar (horizontal icons) */}
                <motion.div
                    className="pointer-events-auto relative flex items-center justify-around gap-1"
                    style={{
                        height: `calc(${BAR_H}px + env(safe-area-inset-bottom))`,
                        marginTop: contentMargin,
                        opacity: contentOpacity
                    }}
                >
                    {resources.map(({id, images, display_name, slug, Icon}) => (
                        <button
                            key={id}
                            aria-label={display_name || slug}
                            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-transform will-change-transform active:scale-95"
                            onClick={() => { /* no-op for now */
                            }}
                            onPointerUp={(_) => {
                                // If user drags up starting from a button, let drag handle it; simple tap can be handled too
                                // Keep simple: taps do nothing in this dummy state
                            }}
                        >
                            {id.startsWith('SYS')
                                ? <Icon className="h-5 w-5"/>
                                : <Avatar src={images?.avatar} initials={display_name?.[0] || slug[0]}
                                          className="size-8"/>
                            }
                        </button>
                    ))}
                </motion.div>

                {/* Drag handle */}
                <div className="pointer-events-none absolute -top-2 left-0 right-0 flex justify-center z-10">
                    <div className="h-1.5 w-12 rounded-full bg-zinc-300/80 dark:bg-white/20"/>
                </div>

                {/* Invisible overlay to hint drag (bigger touch target) */}
                <div
                    className="absolute -top-4 left-0 right-0 h-6 cursor-grab touch-none active:cursor-grabbing z-10"
                    onPointerDown={() => { /* purely for cursor */
                    }}
                />

                {/* Revealed panel (vertical list) */}
                <div
                    className="pointer-events-auto"
                    style={{height: EXPANDED}}
                >
                    <div className="p-3">
                        <ul className="divide-y divide-zinc-200/60 dark:divide-white/10">
                            {resources.map(({id, images, display_name, slug, Icon}) => (
                                <li key={id}>
                                    <button
                                        className="flex w-full items-center gap-3 py-3 px-2 text-left text-zinc-900 dark:text-zinc-100"
                                        onClick={() => {
                                            snap(false)
                                            navigate(id.startsWith('SYS') ? `${slug}` : `/p/${slug}`)
                                        }}
                                    >
                                        {id.startsWith('SYS')
                                            ? <span
                                                className="inline-flex size-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 ring-1 ring-zinc-900/5 dark:bg-white/5 dark:text-zinc-300 dark:ring-white/10">
                                            <Icon className="size-5"/>
                                        </span>
                                            : <Avatar src={images?.avatar} initials={display_name?.[0] || slug[0]}
                                                      className="size-8"/>
                                        }
                                        <span className="text-base">{display_name || slug}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
