import { ReactNode } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { Heading, Text } from '@/components/shared/text'
import { motion } from 'motion/react'

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

    const animateDirection = side === 'top' || side === 'bottom' ? 'y' : 'x'

    return (
        <TooltipPrimitive.Provider delayDuration={typeof delayDuration !== undefined ? delayDuration : 100}>
            <TooltipPrimitive.Root>
                <TooltipPrimitive.Trigger className="inline-flex" asChild>
                    {children}
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content asChild side={side || 'top'}>
                        <motion.div
                            className="rounded bg-n-8 max-w-76 px-3 py-2 text-sm select-none text-white [&>*]:!text-white shadow-md dark:bg-n-7 relative"
                            initial={{ opacity: 0, [animateDirection]: -5, rotateX: -20 }}
                            animate={{ opacity: 1, [animateDirection]: 0, rotateX: 0 }}
                            exit={{ opacity: 0, [animateDirection]: -5, rotateX: -20 }}
                            transition={{
                                duration: 0.3,
                                ease: [0.16, 1, 0.3, 1], // Custom ease curve for a subtle fold effect
                            }}
                            style={{
                                transformOrigin: `${side || 'top'} center`,
                                perspective: '800px',
                            }}
                        >
                            {content}
                            <TooltipPrimitive.Arrow className="fill-n-8 dark:fill-n-7" />
                        </motion.div>
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    )
}

export function TooltipBody({ children }: { children: ReactNode }) {
    return <div className="p-4 flex flex-col gap-2">{children}</div>
}

export function TooltipTitle({ children }: { children: ReactNode }) {
    return <Heading className="font-semibold">{children}</Heading>
}

export function TooltipDescription({ children }: { children: ReactNode }) {
    return <Text size="xs">{children}</Text>
}
