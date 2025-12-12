/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import * as Headless from '@headlessui/react'
import {ComponentPropsWithoutRef, ForwardedRef, forwardRef} from 'react'
import {Link as RouterLink} from 'wouter'
import {cn} from "@/lib";

const Link = forwardRef(function Link(
    props: Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
        to?: string
        href?: string
        nref?: string
    },
    ref: ForwardedRef<HTMLAnchorElement>
) {
    const shallowProps = {...props}
    const href = shallowProps.href || shallowProps.to
    delete shallowProps.href
    delete shallowProps.to

    // Check if the link is external (starts with http)
    const isExternal = href?.startsWith('http')

    return (
        <Headless.DataInteractive>
            {isExternal ? (
                <a
                    {...shallowProps}
                    href={href}
                    className={cn('text-indigo-500', props.className)}
                    ref={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                />
            ) : (
                // @ts-ignore
                <RouterLink
                    {...shallowProps}
                    to={shallowProps.nref || `~${href}`}
                    className={cn('text-indigo-500', props.className)}
                    ref={ref}
                />
            )}
        </Headless.DataInteractive>
    )
})

export default Link
