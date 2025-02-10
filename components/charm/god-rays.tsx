const classNames = (...classes) => classes.filter(Boolean).join(' ')

/**
 * GodRays component
 *
 * @param {object} props
 * @param {number} [props.durationSeconds] Animation duration in seconds
 * @param {string} [props.className]
 */
export default function GodRays({ durationSeconds = 60, className }) {
    return (
        <div className="absolute inset-0 overflow-hidden">
            <div
                className={classNames(
                    `pointer-events-none absolute -inset-[10px] overflow-hidden text-white blur-[15px] invert dark:text-black dark:invert-0`,
                    className,
                )}
                style={{
                    transform: 'translate3d(0, 0, 0)', // Fixes blurred edges in Safari
                    '--bg': 'currentcolor',
                    '--duration': `${durationSeconds}s`,
                    '--stripes': `repeating-linear-gradient(
            110deg,
            var(--bg) 0%,
            var(--bg) 7%,
            transparent 10%,
            transparent 12%,
            var(--bg) 16%
          )`,
                    '--rainbow': `repeating-linear-gradient(
            110deg,
            #60a5fa 10%,
            #e879f9 15%,
            #60a5fa 20%,
            #5eead4 25%,
            #60a5fa 30%
          )`,
                    backgroundImage: 'var(--stripes), var(--rainbow)',
                    backgroundSize: '120%, 200%',
                    backgroundPosition: '50% 50%, 50% 50%',
                }}
            >
                <div
                    className="absolute h-full w-[300%] animate-god-rays mix-blend-difference"
                    style={{
                        backgroundImage: 'var(--stripes), var(--rainbow)',
                        backgroundSize: '100%, 100%',
                        backgroundPosition: '50% 50%',
                    }}
                ></div>
            </div>
        </div>
    )
}
