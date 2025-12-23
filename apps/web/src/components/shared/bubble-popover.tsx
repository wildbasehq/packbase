/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {cn, isVisible} from '@/lib'
import {Button, Desktop, Mobile} from '@/src/components'
import {CheckCircleIcon, ExclamationCircleIcon, QuestionMarkCircleIcon} from '@heroicons/react/24/outline'
import {ExclamationTriangleIcon} from '@heroicons/react/24/solid'
import {XIcon} from 'lucide-react'
import {AnimatePresence, LayoutGroup, motion} from 'motion/react'
import {Activity, ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import {Drawer} from 'vaul'

export interface BubblePopoverProps {
    /** Unique id for Framer Motion layoutId grouping */
    id: string
    /** Trigger button / element */
    trigger: (props: { open: boolean; setOpen: (open: boolean) => void }) => ReactNode
    /** Popover content. Will be rendered inside the animated card container. */
    children: ((props: { setOpen: (open: boolean) => void }) => ReactNode) | ReactNode
    /** If true, render the popover centered on screen via a portal */
    isCentered?: boolean
    /** Explicit corner to open the popover from (only applicable when isCentered is false) */
    corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    className?: string
    animateKey?: string
    custom?: any
}

export function BubblePopover({
                                  id,
                                  trigger,
                                  children,
                                  className,
                                  isCentered = false,
                                  corner,
                                  custom,
                                  animateKey
                              }: BubblePopoverProps) {
    const [open, setOpen] = useState<boolean>(false)
    const rootRef = useRef<HTMLDivElement | null>(null)
    const prevOpenRef = useRef(false)
    const [closingPulse, setClosingPulse] = useState(false)

    // Compute corner positioning classes
    const cornerClasses = useMemo(() => {
        if (isCentered || !corner) return ''

        switch (corner) {
            case 'top-left':
                return 'top-0 left-0'
            case 'top-right':
                return 'top-0 right-0'
            case 'bottom-left':
                return 'bottom-0 left-0'
            case 'bottom-right':
                return 'bottom-0 right-0'
            default:
                return ''
        }
    }, [corner, isCentered])

    useEffect(() => {
        if (prevOpenRef.current && !open) {
            setClosingPulse(true)
            const t = setTimeout(() => setClosingPulse(false), 180)
            return () => clearTimeout(t)
        }
        prevOpenRef.current = open
    }, [open])

    const childrenRender = typeof children === 'function' ? children({setOpen}) : children

    return (
        <>
            <Mobile>
                <Drawer.Root>
                    <Drawer.Trigger asChild>{trigger({open, setOpen})}</Drawer.Trigger>
                    <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 bg-black/40"/>
                        <Drawer.Content
                            className="fixed flex md:inset-x-4 max-h-svh bottom-0 z-50 mx-auto w-full md:w-sm overflow-hidden rounded-3xl border bg-card p-6 drop-shadow-sm pointer-events-auto md:mx-auto"
                        >
                            <div className="flex-1 overflow-y-scroll">
                                <div className="hidden sr-only">
                                    <Drawer.Title>
                                        Bottom Drawer Sheet
                                    </Drawer.Title>
                                </div>

                                <MobileAnimatedContent animateKey={animateKey}>
                                    {childrenRender}
                                </MobileAnimatedContent>
                            </div>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            </Mobile>

            <Desktop>
                <LayoutGroup id={id}>
                    <motion.div
                        ref={rootRef}
                        layoutId={`${id}-root-container`}
                        style={{borderRadius: 24}}
                        aria-hidden={open ? true : undefined}
                        animate={{
                            filter: closingPulse ? 'blur(1px)' : 'blur(0px)',
                            opacity: closingPulse ? 0.2 : 1,
                        }}
                        transition={{
                            duration: 0.27,
                            ease: [0.26, 0.08, 0.25, 1],
                        }}
                        drag
                        dragElastic={0.005}
                        dragTransition={{bounceStiffness: 1000}}
                        dragConstraints={{top: 0, right: 0, bottom: 0, left: 0}}
                        className={cn(
                            open ? 'invisible' : '',
                            'relative'
                        )}
                    >
                        {trigger({open, setOpen})}
                    </motion.div>

                    <PortaledIf when={isCentered}>
                        <AnimatePresence>
                            {open && (
                                <motion.div
                                    className="fixed inset-0 z-[100] bg-black"
                                    initial={{opacity: 0}}
                                    animate={{opacity: 0.5}}
                                    exit={{opacity: 0}}
                                    onClick={() => setOpen(false)}
                                />
                            )}
                        </AnimatePresence>

                        <AnimatePresence initial={false} mode="popLayout" custom={custom}>
                            {open && (
                                isCentered ? (
                                    <div
                                        className={cn('fixed inset-0 z-[101] flex items-center justify-center pointer-events-none', className)}>
                                        <motion.div
                                            className="w-sm overflow-hidden border bg-card p-6 drop-shadow-sm pointer-events-auto"
                                            layoutId={`${id}-root-container`}
                                            layout
                                            style={{borderRadius: 24}}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 24,
                                                borderRadius: {
                                                    duration: 0,
                                                }
                                            }}
                                        >
                                            <motion.div
                                                className="relative flex h-full w-full flex-col px-1 py-1"
                                                layout
                                                key={animateKey}
                                                initial={{opacity: 0, scale: 0.96, filter: 'blur(8px)'}}
                                                animate={{opacity: 1, scale: 1, y: 0, filter: 'blur(0)'}}
                                                exit={{opacity: 0, scale: 0.96, filter: 'blur(8px)'}}
                                                transition={{
                                                    duration: 0.27,
                                                    ease: [0.26, 0.08, 0.25, 1],
                                                }}
                                            >
                                                {childrenRender}
                                            </motion.div>
                                        </motion.div>
                                    </div>
                                ) : (
                                    <motion.div
                                        className={cn('absolute z-[101] w-sm overflow-hidden border bg-card p-6 drop-shadow-sm', cornerClasses, className)}
                                        layoutId={`${id}-root-container`}
                                        layout
                                        style={{borderRadius: 24}}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 24,
                                            borderRadius: {duration: 0}
                                        }}
                                    >
                                        <motion.div
                                            className="relative flex h-full w-full flex-col px-1 py-1"
                                            layout
                                            key={animateKey}
                                            initial={{opacity: 0, scale: 0.96, filter: 'blur(8px)'}}
                                            animate={{opacity: 1, scale: 1, y: 0, filter: 'blur(0)'}}
                                            exit={{opacity: 0, scale: 0.96, filter: 'blur(8px)'}}
                                            transition={{
                                                duration: 0.27,
                                                ease: [0.26, 0.08, 0.25, 1],
                                            }}
                                        >
                                            {childrenRender}
                                        </motion.div>
                                    </motion.div>
                                )
                            )}
                        </AnimatePresence>
                    </PortaledIf>
                </LayoutGroup>
            </Desktop>
        </>
    )
}

/**
 * MobileAnimatedContent
 * Animates its own height to follow content size changes using a tween
 * easing that matches the provided Drawer example.
 */
function MobileAnimatedContent({
                                   children,
                                   animateKey,
                               }: { children: ReactNode; animateKey?: string }) {
    const elementRef = useRef<HTMLDivElement | null>(null)
    const [height, setHeight] = useState<number>(0)

    // Measure immediately after mount for correct first paint height
    useLayoutEffect(() => {
        const el = elementRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        setHeight(rect.height)
    }, [])

    // Observe subsequent content size changes
    useEffect(() => {
        const el = elementRef.current
        if (!el || typeof ResizeObserver === 'undefined') return

        const ro = new ResizeObserver(() => {
            const rect = el.getBoundingClientRect()
            setHeight(rect.height)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    return (
        <motion.div
            // Outer wrapper animates height to follow measured content
            animate={{height}}
            style={{height, overflow: 'hidden'}}
            transition={{
                type: 'tween',
                ease: [0.26, 1, 0.5, 1],
                bounce: 0,
                duration: 0.27,
            }}
        >
            <div ref={elementRef}>
                <motion.div
                    key={animateKey}
                    initial={{opacity: 0, scale: 0.96, filter: 'blur(8px)'}}
                    animate={{opacity: 1, scale: 1, y: 0, filter: 'blur(0)'}}
                    exit={{opacity: 0, scale: 0.96, filter: 'blur(8px)'}}
                    transition={{
                        duration: 0.27,
                        ease: [0.26, 0.08, 0.25, 1],
                    }}
                >
                    {children}
                </motion.div>
            </div>
        </motion.div>
    )
}

export interface PopoverHeaderProps {
    variant?: 'info' | 'warning' | 'destructive' | 'success'
    /** Title content */
    title: ReactNode
    /** Optional description below the title */
    description?: ReactNode
    /** Right icon element, e.g., close icon (decorative by default) */
    rightIcon?: ReactNode

    /** Callback invoked when the close button is clicked */
    onClose?: () => void

    /** Callback invoked when the primary action button is clicked */
    onPrimaryAction?: () => void

    /** Override the cancel button text */
    cancelButtonText?: string

    /** Override the primary action button text */
    primaryButtonText?: string
}

/**
 * Reusable header for iOSPopover content with consistent layout and motion wrappers.
 */
export function PopoverHeader({
                                  variant = 'info',
                                  title,
                                  description,
                                  rightIcon,
                                  onClose,
                                  onPrimaryAction,
                                  cancelButtonText,
                                  primaryButtonText
                              }: PopoverHeaderProps) {
    const prevVariant = useRef(variant)

    const Icon = useMemo(() => {
        if (prevVariant.current !== variant && prevVariant.current !== undefined) {
            throw new Error('Variant cannot change after initial render and indicates a poor design choice.')
        }
        prevVariant.current = variant

        switch (variant) {
            case 'info':
                return <QuestionMarkCircleIcon className="w-12 h-12 text-indigo-500"/>
            case 'warning':
                return <ExclamationCircleIcon className="w-12 h-12 text-amber-500"/>
            case 'destructive':
                return <ExclamationTriangleIcon className="w-12 h-12 text-red-500"/>
            case 'success':
                return <CheckCircleIcon className="w-12 h-12 text-green-500"/>
            default:
                return <QuestionMarkCircleIcon className="w-12 h-12 text-amber-500"/>
        }
    }, [])

    return (
        <motion.header>
            <motion.div className="flex items-start justify-between">
                <span className="shrink-0">
                    {Icon}
                </span>
                {onClose && (
                    <span className="h-fit w-fit rounded-full bg-muted p-2" onClick={onClose}>
                        {rightIcon ?? (
                            <XIcon className="h-4 w-4 stroke-[4px] text-muted-foreground" absoluteStrokeWidth/>
                        )}
                    </span>
                )}
            </motion.div>

            <motion.h2 className="mt-2.5 text-[22px] select-none font-semibold text-foreground md:font-medium">
                {title}
            </motion.h2>

            {description ? (
                <p className="mt-3 font-medium leading-[24px] text-muted-foreground select-none md:font-normal">
                    {description}
                </p>
            ) : null}

            <Activity mode={isVisible(!!onClose || !!onPrimaryAction)}>
                <div className="mt-6 flex justify-end space-x-2">
                    {onClose && (
                        <Button outline className="w-full" onClick={onClose}>
                            {cancelButtonText || 'Cancel'}
                        </Button>
                    )}

                    {onPrimaryAction && (
                        // @ts-ignore - Button color prop inferred from variant
                        <Button color={variant === 'destructive' ? 'red' : 'indigo'} className="w-full"
                                onClick={onPrimaryAction}>
                            {primaryButtonText ?? 'Continue'}
                        </Button>
                    )}
                </div>
            </Activity>
        </motion.header>
    )
}

// Non-exported reusable helper to portal children when requested
function PortaledIf({when, children}: { when: boolean; children: ReactNode }) {
    if (!when) return <>{children}</>
    if (typeof document === 'undefined') return <>{children}</>
    return createPortal(children as any, document.body)
}
