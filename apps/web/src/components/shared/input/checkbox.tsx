/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import * as React from 'react'
import {ComponentPropsWithoutRef, ComponentRef, forwardRef} from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'

import {cn} from '@/lib/utils'
import {CheckIcon} from '@heroicons/react/20/solid'

const Checkbox = forwardRef<
    ComponentRef<typeof CheckboxPrimitive.Root>,
    ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({className, ...props}, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            'peer h-4 w-4 shrink-0 rounded-md border border-indigo-500 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-500 data-[state=checked]:text-indigo-500-foreground',
            className
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
            <CheckIcon className="h-4 w-4 text-white"/>
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export {Checkbox}
