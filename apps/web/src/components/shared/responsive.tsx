import {Breakpoint, useBreakpoint} from '@/lib/utils/responsive'
import {ReactNode} from 'react'

interface ResponsiveProps {
    children: ReactNode
    breakpoint: Breakpoint
    mode: 'up' | 'down' | 'only'
}

/**
 * Component for conditionally rendering content based on the current breakpoint
 * @param children - Content to render
 * @param breakpoint - Breakpoint to check
 * @param mode - Mode of comparison ('up', 'down', or 'only')
 */
export function Responsive({children, breakpoint, mode}: ResponsiveProps) {
    const isAtLeastBreakpoint = useBreakpoint(breakpoint)

    // For 'only' mode, we need to check if we're at this breakpoint but not the next one up
    const nextBreakpoint = getNextBreakpoint(breakpoint)
    const isAtMostBreakpoint = nextBreakpoint ? !useBreakpoint(nextBreakpoint) : true

    if (mode === 'up' && isAtLeastBreakpoint) {
        return <>{children}</>
    }

    if (mode === 'down' && !isAtLeastBreakpoint) {
        return <>{children}</>
    }

    if (mode === 'only' && isAtLeastBreakpoint && isAtMostBreakpoint) {
        return <>{children}</>
    }

    return null
}

/**
 * Component for rendering content only on mobile devices
 * @param children - Content to render
 */
export function Mobile({children}: { children: ReactNode }) {
    return (
        <Responsive breakpoint="md" mode="down">
            {children}
        </Responsive>
    )
}

/**
 * Component for rendering content only on desktop devices
 * @param children - Content to render
 */
export function Desktop({children}: { children: ReactNode }) {
    return (
        <Responsive breakpoint="md" mode="up">
            {children}
        </Responsive>
    )
}

/**
 * Component for rendering different content based on the breakpoint
 * @param mobile - Content to render on mobile
 * @param desktop - Content to render on desktop
 */
export function ResponsiveSwitch({mobile, desktop}: { mobile: ReactNode; desktop: ReactNode }) {
    return (
        <>
            <Mobile>{mobile}</Mobile>
            <Desktop>{desktop}</Desktop>
        </>
    )
}

// Helper function to get the next breakpoint up
function getNextBreakpoint(breakpoint: Breakpoint): Breakpoint | null {
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
    const index = breakpoints.indexOf(breakpoint)

    if (index === -1 || index === breakpoints.length - 1) {
        return null
    }

    return breakpoints[index + 1]
}

// Export the components
export default {
    Responsive,
    Mobile,
    Desktop,
    ResponsiveSwitch,
}
