/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React from 'react'
import {cn} from '@/lib'

export type FloatingCalloutPlacement = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

export type FloatingCalloutPointerAlign = 'start' | 'center' | 'end'

export type FloatingCalloutAnchorSide = 'top' | 'bottom'

export type FloatingCalloutTrigger =
    | HTMLElement
    | null
    | React.RefObject<HTMLElement | null | undefined>

export interface FloatingCalloutProps {
    /** Whether the callout is rendered. */
    open: boolean

    /** The callout body (usually an <Alert/> or <Card/>). */
    children: React.ReactNode

    /** Where on the screen the callout overlay should be aligned. */
    placement?: FloatingCalloutPlacement

    /** z-index utility class for the overlay wrapper. */
    zIndexClassName?: string

    /** Extra classes for the inner container (the box that holds the pointer + content). */
    containerClassName?: string

    /**
     * Pointer alignment along the top edge of the callout container.
     * (Matches current design: pointer is above the callout and points upward.)
     */
    pointerAlign?: FloatingCalloutPointerAlign

    /** Pixel offset for the pointer along the aligned edge. */
    pointerOffsetPx?: number

    /**
     * Optional trigger used to position the callout around a specific element.
     * If provided, the callout attempts to center itself with the trigger and clamps to viewport.
     */
    trigger?: FloatingCalloutTrigger

    /** Which side of the trigger the callout should render on when trigger is provided. */
    anchorSide?: FloatingCalloutAnchorSide

    /** Gap between trigger and callout (in px). */
    anchorGapPx?: number

    /** Minimum padding from viewport edges (in px) when clamping. */
    viewportPaddingPx?: number
}

function pointerAlignToClass(align: FloatingCalloutPointerAlign, offsetPx?: number) {
    if (align === 'center') return ''
    if (align === 'end') return 'right-0'

    // start
    if (typeof offsetPx === 'number') return undefined
    return 'left-8'
}

/**
 * A small reusable “coachmark” / callout overlay that includes the pointer triangle.
 *
 * Note: This intentionally doesn’t trap focus (unlike a Dialog) because it’s a passive tip.
 */
export function FloatingCallout({
                                    open,
                                    children,
                                    placement = 'top-left',
                                    zIndexClassName = 'z-51',
                                    containerClassName,
                                    pointerAlign = 'start',
                                    pointerOffsetPx,
                                    trigger,
                                    anchorSide = 'bottom',
                                    anchorGapPx = 12,
                                    viewportPaddingPx = 12,
                                }: FloatingCalloutProps) {
    if (!open) return null

    const overlayAlignClassName: string = {
        'top-left': 'items-start justify-start',
        'top-right': 'items-start justify-end',
        'bottom-left': 'items-end justify-start',
        'bottom-right': 'items-end justify-end',
    }[placement]

    const resolvedTrigger: HTMLElement | null = (() => {
        if (!trigger) return null
        // RefObject
        if (typeof trigger === 'object' && 'current' in trigger) return (trigger as any).current ?? null
        // HTMLElement
        return trigger as HTMLElement
    })()

    const [anchorStyle, setAnchorStyle] = React.useState<React.CSSProperties | null>(null)
    const [computedPointerLeftPx, setComputedPointerLeftPx] = React.useState<number | null>(null)

    const calloutRef = React.useRef<HTMLDivElement | null>(null)

    const snapToDevicePixel = React.useCallback((valuePx: number) => {
        const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1
        return Math.round(valuePx * dpr) / dpr
    }, [])

    const updateAnchoredPosition = React.useCallback(() => {
        if (!resolvedTrigger || !calloutRef.current) {
            setAnchorStyle(null)
            setComputedPointerLeftPx(null)
            return
        }

        const triggerRect = resolvedTrigger.getBoundingClientRect()
        const calloutRect = calloutRef.current.getBoundingClientRect()

        const viewportW = window.innerWidth
        const viewportH = window.innerHeight

        // Center to trigger by default
        const desiredLeft = triggerRect.left + triggerRect.width / 2 - calloutRect.width / 2
        const clampedLeftRaw = Math.min(
            Math.max(desiredLeft, viewportPaddingPx),
            Math.max(viewportPaddingPx, viewportW - viewportPaddingPx - calloutRect.width),
        )

        const desiredTop =
            anchorSide === 'bottom'
                ? triggerRect.bottom + anchorGapPx
                : triggerRect.top - anchorGapPx - calloutRect.height
        const clampedTopRaw = Math.min(
            Math.max(desiredTop, viewportPaddingPx),
            Math.max(viewportPaddingPx, viewportH - viewportPaddingPx - calloutRect.height),
        )

        const clampedLeft = snapToDevicePixel(clampedLeftRaw)
        const clampedTop = snapToDevicePixel(clampedTopRaw)

        setAnchorStyle({
            position: 'fixed',
            left: clampedLeft,
            top: clampedTop,
        })

        // Point to trigger center; clamp to avoid the triangle spilling outside the callout.
        const triggerCenterX = triggerRect.left + triggerRect.width / 2
        const leftWithinCalloutRaw = triggerCenterX - clampedLeft

        const triangleHalfWidth = 8
        // Clamp inside the callout box (viewport padding isn't relevant here).
        const minX = triangleHalfWidth
        const maxX = Math.max(minX, calloutRect.width - triangleHalfWidth)
        const clampedWithin = Math.min(Math.max(leftWithinCalloutRaw, minX), maxX)

        setComputedPointerLeftPx(snapToDevicePixel(clampedWithin))
    }, [anchorGapPx, anchorSide, resolvedTrigger, snapToDevicePixel, viewportPaddingPx])

    React.useEffect(() => {
        if (!open || !resolvedTrigger) return undefined

        updateAnchoredPosition()

        const onResize = () => updateAnchoredPosition()
        window.addEventListener('resize', onResize)
        window.addEventListener('scroll', onResize, true)

        const ro = new ResizeObserver(() => updateAnchoredPosition())
        if (calloutRef.current) ro.observe(calloutRef.current)
        ro.observe(resolvedTrigger)

        return () => {
            window.removeEventListener('resize', onResize)
            window.removeEventListener('scroll', onResize, true)
            ro.disconnect()
        }
    }, [open, resolvedTrigger, updateAnchoredPosition])

    const pointerPlacementClassName = pointerAlignToClass(pointerAlign, pointerOffsetPx)

    let pointerLeftPx: number | null = null
    if (typeof pointerOffsetPx === 'number') pointerLeftPx = pointerOffsetPx
    else if (typeof computedPointerLeftPx === 'number') pointerLeftPx = computedPointerLeftPx

    const shouldHideUntilAnchored = Boolean(resolvedTrigger) && anchorStyle === null

    let anchoredPointerEdgeClassName = '-top-2.5'
    if (resolvedTrigger) {
        anchoredPointerEdgeClassName = anchorSide === 'bottom' ? '-top-2.5' : '-bottom-2.5 rotate-180'
    }

    return (
        <div className={cn('pointer-events-none fixed inset-0 flex', zIndexClassName, overlayAlignClassName)}>
            <div
                ref={calloutRef}
                className={cn(
                    'relative max-w-sm pointer-events-auto',
                    // default matches existing sidebar-layout positioning when not anchored
                    !resolvedTrigger && 'mt-16 ml-3',
                    containerClassName,
                )}
                style={
                    shouldHideUntilAnchored
                        ? ({
                            position: 'fixed',
                            left: -99999,
                            top: -99999,
                            visibility: 'hidden',
                        } satisfies React.CSSProperties)
                        : anchorStyle ?? undefined
                }
            >
                {/* Pointer triangle */}
                <div
                    className={cn('absolute -z-1', anchoredPointerEdgeClassName, pointerPlacementClassName)}
                    style={pointerLeftPx === null ? undefined : {left: pointerLeftPx, transform: 'translateX(-50%)'}}
                >
                    <div
                        className="relative h-0 w-0 border-l-8 border-r-8 border-b-12 border-l-transparent border-r-transparent border-b-border">
                        <div
                            className="absolute -left-[7px] top-[1px] h-0 w-0 border-l-[7px] border-r-[7px] border-b-[10.5px] border-l-transparent border-r-transparent border-muted"/>
                    </div>
                </div>

                {children}
            </div>
        </div>
    )
}
