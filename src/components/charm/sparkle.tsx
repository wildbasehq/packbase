import { useEffect, useRef, useState } from 'react'

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min

/**
 * Hook for performing the callback within setInterval
 *
 * @param {function} callback
 * @param {number} delayMilliseconds
 */
function useInterval(callback: Function, delayMilliseconds: number) {
    const intervalRef = useRef<any>(null)
    const savedCallback = useRef<Function>(callback)

    useEffect(() => {
        savedCallback.current = callback
    }, [callback])

    useEffect(() => {
        const tick = () => savedCallback.current()
        intervalRef.current = window.setInterval(tick, delayMilliseconds)
        return () => window.clearInterval(intervalRef.current)
    }, [delayMilliseconds])
}

let sparkleId = 0

/**
 * Generates a sparkle

 * @param {string[]} colors
 * @param {number} [timeOffsetMilliseconds]
 *
 * @returns {object}
 */
function generateSparkle(colors: string | any[], timeOffsetMilliseconds: number = 0): object {
    return {
        id: ++sparkleId,
        createdAt: Date.now() + timeOffsetMilliseconds,
        color: colors[random(0, colors.length - 1)],
        size: random(5, 10),
        style: {
            top: random(0, 100) + '%',
            left: random(0, 100) + '%',
            animationDelay: timeOffsetMilliseconds + 'ms',
        },
    }
}

const ANIMATION_DURATION_MS = 1500

/**
 * MagicText component
 *
 * @param {object} props
 * @param {number} [props.numSparkles] Number of sparkles to render
 * @param {string[]} [props.colors] Array of sparkle colors
 * @param props.children
 */
export default function MagicElement({
    numSparkles = 10,
    colors = ['#60a5fa', '#e879f9'],
    className = '',
    children,
    ...rest
}: {
    numSparkles?: number
    colors?: string[]
    className?: string
    children: React.ReactNode
}) {
    const [sparkles, setSparkles] = useState(() => {
        return [...Array(numSparkles)].map((_, idx) => {
            return generateSparkle(colors, -((ANIMATION_DURATION_MS / numSparkles) * idx))
        })
    })

    useInterval(() => {
        const now = Date.now()
        const remainingSparkles = sparkles.filter((sp: any) => {
            return now - sp.createdAt < ANIMATION_DURATION_MS
        })

        const sparklesToAdd = numSparkles - remainingSparkles.length

        if (sparklesToAdd > 0) {
            for (let i = 0; i < sparklesToAdd; ++i) remainingSparkles.push(generateSparkle(colors))
        }

        setSparkles(remainingSparkles)
    }, ANIMATION_DURATION_MS / numSparkles)

    return (
        <div className="relative inline-block" {...rest}>
            <div className="relative">{children}</div>
            <div className="absolute inset-0">
                {sparkles.map((sparkle: any) => (
                    <Sparkle key={sparkle.id} color={sparkle.color} size={sparkle.size} style={sparkle.style} />
                ))}
            </div>
        </div>
    )
}

/**
 * Sparkle component
 */
const Sparkle = ({ size, color, style }: { size: number; color: string; style: object }) => {
    const path =
        'M26.5 25.5C19.0043 33.3697 0 34 0 34C0 34 19.1013 35.3684 26.5 43.5C33.234 50.901 34 68 34 68C34 68 36.9884 50.7065 44.5 43.5C51.6431 36.647 68 34 68 34C68 34 51.6947 32.0939 44.5 25.5C36.5605 18.2235 34 0 34 0C34 0 33.6591 17.9837 26.5 25.5Z'
    return (
        <div className="pointer-events-none absolute z-10 animate-magic-sparkle" style={style}>
            <svg
                className="animate-spin-slow"
                style={{
                    filter: `drop-shadow(0 0 2px ${color})`,
                }}
                width={size}
                height={size}
                viewBox="0 0 68 68"
                fill="none"
            >
                <path d={path} fill="white" />
            </svg>
        </div>
    )
}
