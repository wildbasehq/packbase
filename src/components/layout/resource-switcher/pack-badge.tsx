import React from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { motion } from 'framer-motion'
import { CheckBadgeIcon } from '@heroicons/react/20/solid'

interface VerifiedBadgeProps {
    className?: string
    tooltipText?: string
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
    className = '',
    tooltipText = 'Verified pack - This pack has been reviewed and approved by our team',
}) => {
    return (
        <Tooltip.Provider>
            <Tooltip.Root delayDuration={0}>
                <Tooltip.Trigger asChild>
                    <span className={`inline-flex items-center ${className}`}>
                        <motion.span whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
                            <CheckBadgeIcon className="h-5 w-5 fill-green-500" />
                        </motion.span>
                    </span>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                    <Tooltip.Content asChild sideOffset={5}>
                        <motion.div
                            className="ml-18 rounded-md bg-n-8 max-w-76 px-3 py-2 text-xs select-none text-white shadow-md dark:bg-n-6 relative"
                            initial={{ opacity: 0, y: -5, rotateX: -20 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            exit={{ opacity: 0, y: -5, rotateX: -20 }}
                            transition={{
                                duration: 0.3,
                                ease: [0.16, 1, 0.3, 1], // Custom ease curve for a subtle fold effect
                            }}
                            style={{
                                transformOrigin: 'top center',
                                perspective: '800px',
                            }}
                        >
                            {tooltipText}
                            <Tooltip.Arrow className="ml-18 fill-n-8 dark:fill-n-6" />
                        </motion.div>
                    </Tooltip.Content>
                </Tooltip.Portal>
            </Tooltip.Root>
        </Tooltip.Provider>
    )
}
