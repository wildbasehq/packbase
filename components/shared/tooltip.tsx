import {ReactNode} from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import {Text} from '@/components/shared/text'

export default function Tooltip({
                                    children,
                                    content,
                                    delayDuration,
                                    side,
                                }: {
    children: ReactNode
    content: ReactNode | string
    delayDuration?: number
    side?: 'top' | 'bottom' | 'left' | 'right'
}) {
    if (content === null) {
        return <>{children}</>
    }

    return (
        <TooltipPrimitive.Provider delayDuration={typeof delayDuration !== undefined ? delayDuration : 100}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger className="inline-flex" asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Content
                    sideOffset={4}
                    side={side || 'top'}
                    className="z-30 hidden max-w-[20rem] items-center rounded-md border bg-card drop-shadow-lg sm:block"
                >
                    {typeof content === 'string' ? (
                        <Text size="xs" className="px-2 py-1.5 text-center">
                            {content}
                        </Text>
                    ) : (
                        content
                    )}
                    <TooltipPrimitive.Arrow className="fill-n-1 dark:fill-n-7"/>
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    )
}

export function TooltipContent({children}: { children: ReactNode }) {
    return <div className="px-2 py-1.5">{children}</div>
}
