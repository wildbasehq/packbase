/**
 * Bluesky/Twitter-like loading entry
 *
 * When `loaded` becomes true, the Packbase logo zooms in and fades out,
 * while the app content behind it zooms out from a slightly scaled-up state.
 */

import {Logo} from '@/components/shared/logo'
import {cn} from '@/lib/utils'
import {LoadingSpinner} from '@/src/components'
import {AnimatePresence, motion} from 'motion/react'
import {ReactNode, useEffect, useRef, useState} from 'react'

interface AppLoadingProps {
    loaded: boolean
    children?: ReactNode
}

export const AppLoading = ({loaded, children}: AppLoadingProps) => {
    const [showLoadingText, setShowLoadingText] = useState(false)
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (loaded) {
            setShowLoadingText(false)
            return
        }

        const timer = setTimeout(() => {
            setShowLoadingText(true)
        }, 2000)

        return () => clearTimeout(timer)
    }, [loaded])

    return (
        <div className="relative h-full w-full overflow-hidden">
            {/* App content - zooms out when loading completes */}
            <motion.div
                ref={contentRef}
                className="h-full w-full"
                initial={{scale: 1.5, opacity: 0}}
                animate={{
                    scale: loaded ? 1 : 1.1,
                    opacity: loaded ? 1 : 0,
                }}
                transition={{
                    duration: 0.5,
                    ease: [0.23, 1, 0.32, 1], // ease-out-quint
                    delay: loaded ? 0.1 : 0,
                }}
                onAnimationComplete={() => {
                    if (loaded && contentRef.current) {
                        contentRef.current.style.transform = 'none'
                    }
                }}
            >
                {children}
            </motion.div>

            {/* Loading overlay with logo */}
            <AnimatePresence>
                {!loaded && (
                    <motion.div
                        className={cn(
                            'fixed inset-0 z-100 flex flex-col items-center justify-center gap-6',
                            'bg-background'
                        )}
                        initial={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{
                            duration: 0.3,
                            ease: [0.23, 1, 0.32, 1], // ease-out-quint
                            delay: 0.15,
                        }}
                    >
                        <motion.div
                            initial={{scale: 0.5, opacity: 0}}
                            animate={{scale: 0.85, opacity: 1}}
                            exit={{scale: 5, opacity: 0}}
                            transition={{
                                scale: {
                                    duration: 1,
                                    type: 'spring',
                                    bounce: 0.5
                                },
                                opacity: {
                                    duration: 0.15,
                                    ease: 'easeOut'
                                },
                            }}
                        >
                            <Logo className="h-16 w-16 text-foreground"/>
                        </motion.div>

                        <AnimatePresence>
                            <motion.p
                                className="text-sm text-muted-foreground"
                                initial={{opacity: 0, y: 5}}
                                animate={{opacity: showLoadingText ? 1 : 0, y: showLoadingText ? 0 : 5}}
                                exit={{opacity: 0}}
                                transition={{
                                    duration: 1,
                                    ease: [0.23, 1, 0.32, 1],
                                }}
                            >
                                <LoadingSpinner/>
                            </motion.p>
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}