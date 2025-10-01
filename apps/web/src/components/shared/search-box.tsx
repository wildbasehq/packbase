'use client'

import * as React from 'react'
import {FormEvent, useEffect, useRef, useState} from 'react'
import {Input} from './input/text'
import {cn, useSearch} from '@/lib'

interface SearchBoxProps {
    className?: string
    placeholder?: string
    onSearch?: (value: string) => void
    autoFocus?: boolean
    inAppTab?: boolean
}

export function SearchBox({placeholder = 'Search...', onSearch, autoFocus = true, inAppTab}: SearchBoxProps) {
    const {query, setQuery} = useSearch()
    const inputRef = React.useRef<HTMLInputElement>(null)

    // Inside your component before the return statement, add:
    const prevQueryStartsWithBracket = useRef(false)
    const [gradientDirection, setGradientDirection] = useState('forward')

    // Add this effect to track query changes
    useEffect(() => {
        const currentStartsWithBracket = query?.startsWith('[')

        if (currentStartsWithBracket !== prevQueryStartsWithBracket.current) {
            setGradientDirection(currentStartsWithBracket ? 'forward' : 'reverse')
        }

        prevQueryStartsWithBracket.current = currentStartsWithBracket
    }, [query])

    const gradientBorderAnimationClass = `
  relative
  after:content-['']
  after:absolute
  after:pointer-events-none
  after:inset-[-1px]
  after:rounded-[calc(theme(borderRadius.xl)+1px)]
  after:bg-[linear-gradient(-45deg,_#b25aff_0,#e62c6d_8%,#ff530f_17%,#ff9100_25%,#ffc400_33%,theme(colors.amber.500)_34%,theme(colors.amber.500)_40%,#ffffff_45%,transparent_100%)]
  after:bg-[length:400%_200%]
  after:transition-[background-position,opacity]
  after:ease-out
  after:duration-500
  after:z-0
  after:opacity-0
`

    useEffect(() => {
        let timer
        if (autoFocus && inputRef.current) {
            // Small delay to ensure animation has started
            timer = setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
        }
        return () => timer && clearTimeout(timer)
    }, [autoFocus])

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault()
        if (onSearch) {
            onSearch(query)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={cn(
                'w-full [&>div]:w-full flex items-center rounded-xl !text-lg transition-colors font-medium duration-300 z-[1]',
                inAppTab ? 'px-0 py-0' : 'px-4 py-2 !h-12 ring-1 shadow-xs ring-default',
                inAppTab ?? gradientBorderAnimationClass,
                query?.startsWith('[')
                    ? `after:opacity-100
                            ${gradientDirection === 'forward' ? 'after:bg-[position:100%_100%]' : 'after:bg-[position:0_0]'}
                            `
                    : ''
            )}
        >
            {!inAppTab &&
                <div className="absolute inset-0 w-full h-full z-[1] rounded transition-opacity duration-300"/>}
            <Input
                combined
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full focus-within:!ring-0 !bg-transparent z-[2] !max-w-full"
                inputClassName={cn('w-full', inAppTab ? '' : 'pl-8 w-full')}
            />
        </form>
    )
}
