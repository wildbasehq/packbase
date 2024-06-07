'use client'

import {ReactNode} from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'

export default function Tooltip({children, content, delayDuration, side}: {
    children: ReactNode;
    content: ReactNode | string;
    delayDuration?: number;
    side?: 'top' | 'bottom' | 'left' | 'right';
}) {
    if (content === null) {
        return (
            <>
                {children}
            </>
        )
    }

    return (
        <TooltipPrimitive.Provider delayDuration={typeof delayDuration !== undefined ? delayDuration : 100}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger className="hidden sm:inline-flex" asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Content
                    sideOffset={4}
                    side={side || 'top'}
                    className="z-30 hidden items-center rounded-md border border-default max-w-[20rem] bg-card drop-shadow-lg sm:block"
                >
                    {typeof content === 'string' ? (
                        <div className="px-2 py-1.5">
                            <span className="block text-center font-light text-xs">
                                {content}
                            </span>
                        </div>
                    ) : (
                        content
                    )}
                    <TooltipPrimitive.Arrow className="fill-n-1 dark:fill-n-7"/>
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    )
}
