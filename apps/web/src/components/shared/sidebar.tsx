/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import {LayoutGroup, motion} from 'motion/react'
import React, {forwardRef, useId} from 'react'
import {TouchTarget} from './button'
import Link from './link'
import {ArrowUpRightIcon} from 'lucide-react'
import {useLocation} from 'wouter'

export function Sidebar({className, ...props}: React.ComponentPropsWithoutRef<'nav'>) {
    return <nav {...props} className={clsx(className, 'flex h-full min-h-0 flex-col')}/>
}

export function SidebarHeader({className, ...props}: React.ComponentPropsWithoutRef<'div'>) {
    return <div {...props}
                className={clsx(className, 'flex flex-col border-b p-3.5 [&>[data-slot=section]+[data-slot=section]]:mt-2.5')}/>
}

export function SidebarBody({className, ...props}: React.ComponentPropsWithoutRef<'div'>) {
    return (
        <div
            {...props}
            className={clsx(
                className,
                'flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-4 [&>[data-slot=section]+[data-slot=section]]:mt-8'
            )}
        />
    )
}

export function SidebarFooter({className, ...props}: React.ComponentPropsWithoutRef<'div'>) {
    return <div {...props}
                className={clsx(className, 'flex flex-col border-t p-4 [&>[data-slot=section]+[data-slot=section]]:mt-2.5')}/>
}

export function SidebarSection({className, ...props}: React.ComponentPropsWithoutRef<'div'>) {
    let id = useId()

    return (
        <LayoutGroup id={id}>
            <div {...props} data-slot="section" className={clsx(className, 'flex flex-col gap-1')}/>
        </LayoutGroup>
    )
}

export function SidebarDivider({className, ...props}: React.ComponentPropsWithoutRef<'hr'>) {
    return <hr {...props} className={clsx(className, 'my-4 border-t lg:-mx-4')}/>
}

export function SidebarSpacer({className, ...props}: React.ComponentPropsWithoutRef<'div'>) {
    return <div aria-hidden="true" {...props} className={clsx(className, 'mt-8 flex-1')}/>
}

export function SidebarHeading({className, ...props}: React.ComponentPropsWithoutRef<'h3'>) {
    return <h3 {...props}
               className={clsx(className, 'select-none mb-1 px-2 text-xs/6 font-medium text-zinc-500 dark:text-zinc-400')}/>
}

export const SidebarItem = forwardRef(function SidebarItem(
    {
        current,
        className,
        children,
        ...props
    }: { current?: boolean; className?: string; children: React.ReactNode } & (
        | Omit<Headless.ButtonProps, 'as' | 'className'>
        | Omit<Headless.ButtonProps<typeof Link>, 'as' | 'className'>
        ),
    ref: React.ForwardedRef<HTMLAnchorElement | HTMLButtonElement>
) {
    const [pathname] = useLocation()
    if (typeof current === 'undefined') {
        current = 'href' in props ? pathname === props.href : false
    }
    let classes = clsx(
        // Base
        'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-base/6 font-medium text-default sm:py-2 sm:text-sm/5',
        // Leading icon/icon-only
        '*:data-[slot=icon]:size-6 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:fill-n-5 sm:*:data-[slot=icon]:size-5',
        // Trailing icon (down chevron or similar)
        '*:last:data-[slot=icon]:ml-auto *:last:data-[slot=icon]:size-5 sm:*:last:data-[slot=icon]:size-4',
        // Avatar
        '*:data-[slot=avatar]:-m-0.5 *:data-[slot=avatar]:size-7 *:data-[slot=avatar]:[--ring-opacity:10%] sm:*:data-[slot=avatar]:size-6',
        // Hover
        'data-hover:bg-n-2/25 data-hover:*:data-[slot=icon]:fill-n-9 data-hover:ring-2 ring-default transition-all',
        // Active
        'data-active:bg-n-2/25 data-active:*:data-[slot=icon]:fill-n-9',
        // Current - added shadow-inner for subtle inner shadow when current
        'data-current:shadow-inner data-current:bg-n-1/25 data-current:*:data-[slot=icon]:fill-n-9 dark:shadow-n-9 data-current:dark:bg-n-8',
        // Same with hover
        'data-hover:shadow-inner dark:shadow-n-9',
        // Dark mode
        'dark:text-white dark:*:data-[slot=icon]:fill-n-4',
        'dark:data-hover:bg-n-6/50 dark:data-hover:*:data-[slot=icon]:fill-white',
        'dark:data-active:bg-n-6/50 dark:data-active:*:data-[slot=icon]:fill-white',
        'dark:data-current:*:data-[slot=icon]:fill-white'
    )

    return (
        <span className={clsx(className, 'relative')}>
            {current && (
                <motion.span
                    layoutId="current-indicator"
                    className="absolute inset-y-2 -left-4 w-0.5 rounded-full bg-zinc-950 dark:bg-white"
                />
            )}
            {'href' in props ? (
                <Headless.CloseButton as={Link} {...props} className={classes}
                                      data-current={current ? 'true' : undefined} ref={ref}>
                    <TouchTarget>{children}</TouchTarget>
                </Headless.CloseButton>
            ) : (
                // @ts-ignore
                <Headless.Button
                    {...props}
                    className={clsx('cursor-default', classes)}
                    data-current={current ? 'true' : undefined}
                    ref={ref}
                >
                    <TouchTarget>{children}</TouchTarget>
                </Headless.Button>
            )}
        </span>
    )
})

export function SidebarLabel({className, external, ...props}: {
    external?: boolean
} & React.ComponentPropsWithoutRef<'span'>) {
    return (
        <span {...props} className={clsx(className, 'truncate')}>
            {props.children}
            {external && <ArrowUpRightIcon className="inline-flex h-4 w-4"/>}
        </span>
    )
}
