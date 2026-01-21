import {cn} from '@/lib'
import {animate, motion, useMotionValue, useTransform} from 'motion/react'
import {useEffect} from 'react'

interface NumberTickerProps {
    value: number
    /** Number of decimal places to show */
    decimals?: number
    /** Animation duration in seconds */
    duration?: number
    /** Direction of the rolling animation */
    direction?: 'up' | 'down'
    /** Additional class names */
    className?: string
    /** Whether to show thousands separators */
    separator?: boolean
    /** Custom prefix (e.g., "$") */
    prefix?: string
    /** Custom suffix (e.g., "%") */
    suffix?: string
}

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

/**
 * Animated number ticker that rolls between digit changes.
 * Each digit animates independently for a smooth rolling effect.
 */
export function NumberTicker({
                                 value,
                                 decimals = 0,
                                 duration = 1,
                                 direction = 'up',
                                 className,
                                 separator = false,
                                 prefix,
                                 suffix,
                             }: NumberTickerProps) {
    // Format the number to get the string representation
    const formattedValue = formatNumber(value, decimals, separator)

    // Pad to maintain consistent digit count for smoother animations
    const chars = formattedValue.split('')

    return (
        <span className={cn('inline-flex tabular-nums', className)}>
            {prefix && <span>{prefix}</span>}
            {chars.map((char, index) => {
                // Non-digit characters (separators, decimal points) render directly
                if (!/\d/.test(char)) {
                    return (
                        <span key={`sep-${index}`}>
                            {char}
                        </span>
                    )
                }

                return (
                    <RollingDigit
                        key={index}
                        digit={parseInt(char, 10)}
                        duration={duration}
                        direction={direction}
                    />
                )
            })}
            {suffix && <span>{suffix}</span>}
        </span>
    )
}

interface RollingDigitProps {
    digit: number
    duration: number
    direction: 'up' | 'down'
}

/**
 * A single digit that animates by rolling through numbers.
 */
function RollingDigit({
                          digit,
                          duration,
                          direction,
                      }: RollingDigitProps) {
    const motionValue = useMotionValue(digit)

    useEffect(() => {
        const controls = animate(motionValue, digit, {
            ease: [0.26, 0.08, 0.25, 1],
            duration,
        })
        return controls.stop
    }, [digit, duration, motionValue])

    const y = useTransform(motionValue, (val) => {
        const offset = direction === 'up' ? -val : val
        return `${offset}em`
    })

    return (
        <span
            className="mt-0.5 relative inline-block overflow-hidden"
            style={{height: '1em', width: '0.6em'}}>
            <motion.span
                className="absolute left-0 right-0 flex flex-col items-center"
                style={{y}}
            >
                {DIGITS.map((num) => (
                    <span
                        key={num}
                        style={{height: '1em', lineHeight: '1em'}}
                        className="flex items-center justify-center"
                    >
                        {direction === 'up' ? num : 9 - num}
                    </span>
                ))}
            </motion.span>
        </span>
    )
}

/**
 * Format a number with optional decimal places and separators.
 */
function formatNumber(value: number, decimals: number, separator: boolean): string {
    const fixed = value.toFixed(decimals)

    if (!separator) {
        return fixed
    }

    const [intPart, decPart] = fixed.split('.')
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    return decPart ? `${formatted}.${decPart}` : formatted
}

export default NumberTicker
