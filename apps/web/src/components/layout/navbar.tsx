/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {TouchTarget} from '@/components/shared/button'
import Link from '@/components/shared/link'
import {cn} from '@/lib'
import * as Headless from '@headlessui/react'
import {LayoutGroup, motion} from 'motion/react'
import {ComponentPropsWithoutRef, ForwardedRef, forwardRef, ReactNode, useId} from 'react'

// Navbar subcomponents
export function NavbarDivider({className, ...props}: ComponentPropsWithoutRef<'div'>) {
    return <div aria-hidden="true" {...props} className={cn(className, 'h-6 w-px bg-zinc-950/10 dark:bg-white/10')}/>
}

export function NavbarSection({className, ...props}: ComponentPropsWithoutRef<'div'>) {
    let id = useId()

    return (
        <LayoutGroup id={id}>
            <div {...props} className={cn(className, 'flex items-center gap-3')}/>
        </LayoutGroup>
    )
}

export function NavbarSpacer({className, ...props}: ComponentPropsWithoutRef<'div'>) {
    return <div aria-hidden="true" {...props} className={cn(className, '-ml-4 flex-1')}/>
}

export const NavbarItem = forwardRef(function NavbarItem(
    {
        current,
        className,
        children,
        ...props
    }: { current?: boolean; className?: string; children: ReactNode } & (
        | Omit<Headless.ButtonProps, 'as' | 'className'>
        | Omit<ComponentPropsWithoutRef<typeof Link>, 'className'>
        ),
    ref: ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
) {
    let classes = cn(
        // Base
        'relative group flex min-w-0 items-center gap-3 rounded-lg p-2 text-left text-base/6 font-medium text-zinc-950 sm:text-sm/5',
        // Leading icon/icon-only
        '*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:fill-zinc-500 *:data-[slot=icon]:text-zinc-500 sm:*:data-[slot=icon]:size-5',
        // Trailing icon (down chevron or similar)
        '*:not-nth-2:last:data-[slot=icon]:ml-auto *:not-nth-2:last:data-[slot=icon]:size-5 sm:*:not-nth-2:last:data-[slot=icon]:size-4',
        // Avatar
        '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 *:data-[slot=avatar]:[--avatar-radius:var(--radius)] *:data-[slot=avatar]:[--ring-opacity:10%] sm:*:data-[slot=avatar]:size-6',
        // Hover
        'data-hover:bg-zinc-950/5 data-hover:*:data-[slot=icon]:fill-zinc-950 data-hover:*:data-[slot=icon]:text-zinc-950',
        // Active
        'data-active:bg-zinc-950/5 data-active:*:data-[slot=icon]:fill-zinc-950 data-active:*:data-[slot=icon]:text-zinc-950',
        // Dark mode
        'dark:text-white dark:*:data-[slot=icon]:fill-zinc-400',
        'dark:data-hover:bg-white/5 dark:data-hover:*:data-[slot=icon]:fill-white dark:data-hover:*:data-[slot=icon]:text-white',
        'dark:data-active:bg-white/5 dark:data-active:*:data-[slot=icon]:fill-white dark:data-active:*:data-[slot=icon]:text-white'
    )

    return (
        <span className={cn(className, 'relative')}>
            {current && (
                <motion.span
                    layoutId="current-indicator"
                    className="absolute inset-x-2 -bottom-2.5 h-0.5 rounded-full bg-zinc-950 dark:bg-white"
                />
            )}
            {'href' in props ? (
                <Link
                    {...props}
                    className={classes}
                    data-current={current ? 'true' : undefined}
                    ref={ref as ForwardedRef<HTMLAnchorElement>}
                >
                    <TouchTarget>{children}</TouchTarget>
                </Link>
            ) : (
                // @ts-ignore
                <Headless.Button
                    {...props}
                    className={cn('cursor-default', classes)}
                    data-current={current ? 'true' : undefined}
                    ref={ref}
                >
                    <TouchTarget>{children}</TouchTarget>
                </Headless.Button>
            )}
        </span>
    )
})

export function NavbarLabel({className, ...props}: ComponentPropsWithoutRef<'span'>) {
    return <span {...props} className={cn(className, 'truncate')}/>
}

export function Navbar({className, ...props}: ComponentPropsWithoutRef<'nav'>) {
    return <nav {...props} className={cn(className, 'flex flex-1 items-center gap-4 py-2.5')}/>
}
