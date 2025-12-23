import {cn} from '@/lib/utils'
import {ReactNode} from 'react'

export default function Card({children, className, ...props}: {
    children: ReactNode;
    className?: string;
    [_: string]: any
}) {
    return (
        <div
            className={cn(
                'flex h-fit w-full flex-col rounded border bg-white dark:bg-n-8 px-2 py-3 sm:max-w-md sm:px-3 sm:py-4',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    )
}
