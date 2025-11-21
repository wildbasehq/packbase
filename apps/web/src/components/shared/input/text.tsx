/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import React, {forwardRef} from 'react'
import {cn} from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    description?: string
    label?: string
    combined?: boolean
    prefix?: string
    button?: React.ReactNode
    rows?: number
    inputClassName?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({
         inputClassName,
         className,
         type,
         id,
         description,
         prefix,
         button,
         autoComplete,
         label,
         combined,
         ...props
     }, ref) => {
        let InputElement = 'input'
        if (type === 'textarea') { // noinspection ReuseOfLocalVariableJS
            InputElement = 'textarea'
        }

        return (
            <>
                {label && !combined && (
                    <label htmlFor={id} className="text-default mb-1 block select-none text-sm font-medium leading-6">
                        {label}
                        {description && <p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p>}
                    </label>
                )}

                <div className="flex">
                    <div
                        className={cn(
                            combined
                                ? '!rounded-0 !border-0 shadow-none'
                                : 'rounded-xl shadow-xs ring-1 ring-inset ring-neutral-300 dark:ring-white/10',
                            className,
                            'bg-default flex w-full focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600! sm:max-w-md'
                        )}
                    >
                        {prefix && (
                            <span
                                className="-mr-2.5 flex select-none items-center whitespace-pre-wrap pl-3 text-muted-foreground sm:text-sm">{prefix}</span>
                        )}
                        <InputElement
                            // @ts-ignore
                            type={type || 'text'}
                            ref={ref}
                            name={id}
                            id={id}
                            autoComplete={autoComplete || 'off'}
                            className={cn(
                                inputClassName,
                                'text-default rounded-xl block flex-1 border-0 bg-transparent px-3 py-2 placeholder:text-neutral-400 focus:ring-0 sm:text-sm sm:leading-6 focus:outline-none'
                            )}
                            {...props}
                        />
                    </div>
                    {button && button}
                </div>
            </>
        )
    }
)
Input.displayName = 'Input'

export {Input}
