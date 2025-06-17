/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import * as Headless from '@headlessui/react'
import clsx from 'clsx'
import React, { forwardRef } from 'react'
import { TouchTarget } from './button'
import Link from './link'

type AvatarProps = {
    src?: string | null
    square?: boolean
    initials?: string
    alt?: string
    className?: string
}

export function Avatar({
    src = null,
    square = false,
    initials,
    alt = '',
    className,
    ...props
}: AvatarProps & React.ComponentPropsWithoutRef<'span'>) {
    // Random gradient from initial
    if (!src && initials) {
        const charCode = initials.charCodeAt(0)
        const random = Math.floor((charCode / 26) * 360)
        props.style = {
            ...props.style,
            background: `linear-gradient(${random}deg, hsl(${random}, 100%, 80%), hsl(${random + 180}, 100%, 80%))`,
        }
    }

    return (
        <span
            data-slot="avatar"
            {...props}
            className={clsx(
                className,
                // Basic layout
                'inline-grid shrink-0 align-middle [--avatar-radius:20%] [--ring-opacity:20%] *:col-start-1 *:row-start-1',
                'outline outline-3 -outline-offset-2 outline-black/(--ring-opacity) dark:outline-white/(--ring-opacity)',
                // Add the correct border radius
                square ? 'rounded-(--avatar-radius) *:rounded-(--avatar-radius)' : 'rounded-full *:rounded-full'
            )}
        >
            {initials && (
                <svg
                    className="size-full fill-current p-[5%] text-[48px] font-medium uppercase select-none text-white"
                    viewBox="0 0 100 100"
                    aria-hidden={alt ? undefined : 'true'}
                >
                    {alt && <title>{alt}</title>}
                    <text x="50%" y="50%" alignmentBaseline="middle" dominantBaseline="middle" textAnchor="middle" dy=".125em">
                        {initials}
                    </text>
                </svg>
            )}
            {src && <img className="size-full" src={src} alt={alt} />}
        </span>
    )
}

export const AvatarButton = forwardRef(function AvatarButton(
    {
        src,
        square = false,
        initials,
        alt,
        className,
        ...props
    }: AvatarProps & (Omit<Headless.ButtonProps, 'as' | 'className'> | Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'>),
    ref: React.ForwardedRef<HTMLElement>
) {
    let classes = clsx(
        className,
        square ? 'rounded-[20%]' : 'rounded-full',
        'relative inline-grid focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500',
        'rounded-lg isolated relative'
    )

    return 'href' in props ? (
        <Link {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
            <TouchTarget>
                <Avatar src={src} square={square} initials={initials} alt={alt} />
            </TouchTarget>
        </Link>
    ) : (
        // @ts-ignore - bruh
        <Headless.Button {...props} className={classes} ref={ref}>
            <TouchTarget>
                <Avatar src={src} square={square} initials={initials} alt={alt} />
            </TouchTarget>
        </Headless.Button>
    )
})
