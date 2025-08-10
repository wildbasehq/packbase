'use client'

import * as React from 'react'
import { Input } from './input/text'
import { useSearch } from '@/lib'

interface SearchBoxProps {
    className?: string
    placeholder?: string
    onSearch?: (value: string) => void
    autoFocus?: boolean
}

export function SearchBox({ placeholder = 'Search...', onSearch, autoFocus = true }: SearchBoxProps) {
    const { query, setQuery } = useSearch()
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        if (autoFocus && inputRef.current) {
            // Small delay to ensure animation has started
            const timer = setTimeout(() => {
                inputRef.current?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [autoFocus])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (onSearch) {
            onSearch(query)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <Input
                combined
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full focus-within:!ring-0 !bg-transparent"
                inputClassName="pl-8 w-full"
            />
        </form>
    )
}
