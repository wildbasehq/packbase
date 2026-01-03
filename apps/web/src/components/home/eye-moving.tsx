import {SVGProps, useEffect, useMemo, useRef, useState} from 'react'

export function EyeMovingIcon(props: SVGProps<SVGSVGElement>) {
    const svgRef = useRef<SVGSVGElement | null>(null)
    const rafRef = useRef<number | null>(null)

    const [offset, setOffset] = useState({x: 0, y: 0})

    const prefersReducedMotion = useMemo(() => {
        if (typeof window === 'undefined') return true
        return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    }, [])

    useEffect(() => {
        if (prefersReducedMotion) return

        const onPointerMove = (e: PointerEvent) => {
            const svg = svgRef.current
            if (!svg) return

            const rect = svg.getBoundingClientRect()
            const cx = rect.left + rect.width / 2
            const cy = rect.top + rect.height / 2

            const dx = e.clientX - cx
            const dy = e.clientY - cy

            const len = Math.hypot(dx, dy) || 1
            const nx = dx / len
            const ny = dy / len

            // Maximum translation in SVG units (viewBox is 0..24)
            const max = 1.6

            // Scale pixel distance into a 0..1 factor; farther cursor => closer to max
            const factor = Math.min(1, len / 180)

            const x = nx * max * factor
            const y = ny * max * factor

            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = requestAnimationFrame(() => setOffset({x, y}))
        }

        window.addEventListener('pointermove', onPointerMove, {passive: true})
        return () => {
            window.removeEventListener('pointermove', onPointerMove)
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
        }
    }, [prefersReducedMotion])

    return (
        <svg
            ref={svgRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
            {...props}
        >
            <path
                d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"/>

            {/* Iris group */}
            <g
                transform={`translate(${offset.x} ${offset.y})`}
                style={{transition: prefersReducedMotion ? undefined : 'transform 60ms linear'}}
            >
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth={2}/>
            </g>
        </svg>
    )
}
