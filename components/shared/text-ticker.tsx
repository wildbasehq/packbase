'use client'

import {useEffect, useState} from 'react'
import ReactTextTransition, {presets} from 'react-text-transition'
import {SpringConfig} from '@react-spring/web'

export default function TextTicker({texts, interval, springConfig}: {
    texts: string[];
    interval: number;
    springConfig?: SpringConfig;
}) {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        let intervalId = setInterval(
            () => setIndex((index) => index < texts.length - 1 ? index + 1 : 0),
            interval,
        )

        return () => clearTimeout(intervalId)
    }, [setIndex])

    return (
        <ReactTextTransition translateValue="60%" springConfig={springConfig || presets.default}>
            {texts[index]}
        </ReactTextTransition>
    )
}