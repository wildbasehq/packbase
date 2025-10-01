/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import {ArrowLeft} from 'lucide-react'
import {Alert, AlertDescription, AlertTitle} from '@/src/components'
import {motion} from 'motion/react'

/**
 * No chat selected with CTA arrow pointing to left sidebar
 */
export default function NotSelected() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-center p-8">
            <div className="relative max-w-md">
                <div className="absolute -left-16 top-1/2 transform -translate-y-1/2">
                    <motion.div
                        animate={{x: [-6, 6], opacity: [1, 0.75]}}
                        transition={{repeat: Infinity, repeatType: 'reverse', duration: 1.5, ease: 'easeOut'}}
                    >
                        <ArrowLeft size={32} className="text-primary"/>
                    </motion.div>
                </div>

                <Alert className="shadow-sm">
                    <AlertTitle className="text-xl">No conversation selected</AlertTitle>
                    <AlertDescription>
                        Select an existing conversation from the sidebar or start a new one to begin chatting.
                    </AlertDescription>
                </Alert>
            </div>
        </div>
    )
}
