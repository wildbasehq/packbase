import {useEffect, useState} from 'react'
import {AnimatePresence, motion} from 'motion/react'
import {Transition} from "motion";

export default function TextTicker({
                                       texts,
                                       interval
                                   }: {
    texts: string[]
    interval: number
}) {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const id = setInterval(
            () => setIndex((i) => (i < texts.length - 1 ? i + 1 : 0)),
            interval
        )
        return () => clearInterval(id)
    }, [interval, texts.length])

    const transition: Transition = {
        type: 'spring',
        stiffness: 1000,
        damping: 30,
        mass: 1
    }

    return (
        <div
            className="h-4 min-w-1/2 whitespace-nowrap"
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.span
                    key={index}
                    initial={{y: '20%', opacity: 0}}
                    animate={{y: '0%', opacity: 1}}
                    exit={{y: '-60%', opacity: 0, transition: {type: 'tween', duration: 0.15, ease: 'easeIn'}}}
                    transition={transition}
                    className="absolute bottom-0"
                >
                    {texts[index].length > 32 ? texts[index].slice(0, 32) + '...' : texts[index]}
                </motion.span>
            </AnimatePresence>
        </div>
    )
}