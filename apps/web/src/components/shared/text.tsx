import {cn} from '@/lib/utils'
import {ComponentPropsWithoutRef, ElementType, JSX, ReactNode} from 'react'
import Link from './link'

const textSize = {
    xs: '!text-xs/6',
    sm: '!text-sm/6',
    md: '!text-base/6',
    lg: '!text-lg/6',
    xl: '!text-xl/6',
    '2xl': '!text-2xl/6',
    '3xl': '!text-3xl/6',
}

export type TextSize = keyof typeof textSize

export function Heading({
                            as,
                            children,
                            size = 'lg',
                            alt,
                            loading,
                            ...props
                        }: {
    as?: ElementType
    children?: ReactNode
    size?: TextSize
    alt?: boolean
    loading?: boolean
    [_key: string]: any
}): JSX.Element {
    const Comp = as || 'h1'
    props.className = cn(
        'select-none',
        props.className,
        textSize[size],
        'font-medium leading-none tracking-tight',
        alt ? 'text-muted-foreground' : 'text-default',
        loading && 'animate-thinking'
    )
    return <Comp {...props}>{children}</Comp>
}

export function Text({
                         children,
                         as,
                         size = 'sm',
                         alt,
                         loading,
                         ...props
                     }: {
    children?: ReactNode
    as?: ElementType
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
    alt?: boolean
    loading?: boolean
    [_: string]: any
}): JSX.Element {
    const Comp = as || 'p'
    props.className = cn(
        'text-base/6 select-none data-disabled:opacity-50 sm:text-sm/6 prose prose-zinc dark:prose-invert max-w-none break-words',
        props.className,
        textSize[size],
        alt && 'text-muted-foreground',
        loading && 'animate-thinking',
        '[&_p]:leading-relaxed'
    )

    return <Comp {...props}>{children}</Comp>
}

export function TextLink({className, ...props}: ComponentPropsWithoutRef<typeof Link>) {
    return (
        <Link
            {...props}
            className={cn(
                className,
                'text-zinc-950 underline decoration-zinc-950/50 data-hover:decoration-zinc-950 dark:text-white dark:decoration-white/50 dark:data-hover:decoration-white'
            )}
        />
    )
}

export function Strong({className, ...props}: ComponentPropsWithoutRef<'strong'>) {
    return <strong {...props} className={cn(className, 'font-medium text-zinc-950 dark:text-white')}/>
}

export function CodeText({className, ...props}: ComponentPropsWithoutRef<'code'>) {
    return (
        <code
            {...props}
            className={cn(
                className,
                'rounded-sm border border-zinc-950/10 bg-zinc-950/[2.5%] px-0.5 text-sm font-medium text-zinc-950 sm:text-[0.8125rem] dark:border-white/20 dark:bg-white/5 dark:text-white'
            )}
        />
    )
}
