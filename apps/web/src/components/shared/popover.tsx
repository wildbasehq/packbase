/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { ReactNode } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-dropdown-menu'
import { Drawer } from 'vaul'
import useWindowSize from '@/lib/hooks/use-window-size'

export default function Popover({
    children,
    content,
    align = 'center',
    forceMobile = false,
}: {
    children: ReactNode
    content: ReactNode | string
    align?: 'center' | 'start' | 'end'
    forceMobile?: boolean
}) {
    const { isMobile, isDesktop } = useWindowSize()
    if (!isMobile && !isDesktop) return <>{children}</>
    return (
        <>
            {(isMobile || forceMobile) && (
                <Drawer.Root>
                    <Drawer.Trigger>{children}</Drawer.Trigger>
                    <Drawer.Portal>
                        <Drawer.Content className="drawer z-40">{content}</Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            )}
            {isDesktop && !forceMobile && (
                <PopoverPrimitive.Root>
                    <PopoverPrimitive.Trigger className="inline-flex cursor-pointer" asChild>
                        {children}
                    </PopoverPrimitive.Trigger>
                    <PopoverPrimitive.Content
                        sideOffset={4}
                        align={align}
                        className="overflow-hidden animate-slide-up-fade rounded-xl texture-acrylic border shadow-lg z-100"
                    >
                        {content}
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Root>
            )}
        </>
    )
}
