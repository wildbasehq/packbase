import { useEffect, useState } from 'react'

// Breakpoint values from the spacing.css file
const Breakpoints = {
    xs: 320, // 20rem
    sm: 576, // 36rem
    md: 768, // 48rem
    lg: 992, // 62rem
    xl: 1200, // 75rem
    '2xl': 1400, // 87.5rem
}

export type Breakpoint = keyof typeof Breakpoints

/**
 * Hook to check if the current viewport is at least a certain breakpoint
 * @param breakpoint - The breakpoint to check
 * @returns Boolean indicating if the viewport is at least the specified breakpoint
 */
export function useBreakpoint(breakpoint: Breakpoint): boolean {
    const [isAtLeastBreakpoint, setIsAtLeastBreakpoint] = useState<boolean>(false)

    useEffect(() => {
        const checkBreakpoint = () => {
            setIsAtLeastBreakpoint(window.innerWidth >= Breakpoints[breakpoint])
        }

        // Initial check
        checkBreakpoint()

        // Add event listener for window resize
        window.addEventListener('resize', checkBreakpoint)

        // Clean up event listener
        return () => {
            window.removeEventListener('resize', checkBreakpoint)
        }
    }, [breakpoint])

    return isAtLeastBreakpoint
}

/**
 * Hook to get the current active breakpoint
 * @returns The current active breakpoint
 */
export function useActiveBreakpoint(): Breakpoint {
    const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('xs')

    useEffect(() => {
        const checkBreakpoint = () => {
            const width = window.innerWidth

            if (width >= Breakpoints['2xl']) {
                setActiveBreakpoint('2xl')
            } else if (width >= Breakpoints.xl) {
                setActiveBreakpoint('xl')
            } else if (width >= Breakpoints.lg) {
                setActiveBreakpoint('lg')
            } else if (width >= Breakpoints.md) {
                setActiveBreakpoint('md')
            } else if (width >= Breakpoints.sm) {
                setActiveBreakpoint('sm')
            } else {
                setActiveBreakpoint('xs')
            }
        }

        // Initial check
        checkBreakpoint()

        // Add event listener for window resize
        window.addEventListener('resize', checkBreakpoint)

        // Clean up event listener
        return () => {
            window.removeEventListener('resize', checkBreakpoint)
        }
    }, [])

    return activeBreakpoint
}

/**
 * Hook to check if the device is mobile
 * @returns Boolean indicating if the device is mobile
 */
export function useMobileDetect(): boolean {
    const [isMobile, setIsMobile] = useState<boolean>(false)

    useEffect(() => {
        const checkMobile = () => {
            // Check if the device is mobile based on screen width and user agent
            const isMobileByWidth = window.innerWidth < Breakpoints.md
            const isMobileByAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

            setIsMobile(isMobileByWidth || isMobileByAgent)
        }

        // Initial check
        checkMobile()

        // Add event listener for window resize
        window.addEventListener('resize', checkMobile)

        // Clean up event listener
        return () => {
            window.removeEventListener('resize', checkMobile)
        }
    }, [])

    return isMobile
}

/**
 * Hook to get responsive values based on the current breakpoint
 * @param values - Object with values for different breakpoints
 * @returns The value for the current breakpoint
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>> & { default: T }): T {
    const activeBreakpoint = useActiveBreakpoint()

    // Find the closest breakpoint with a defined value
    const breakpointOrder: Breakpoint[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs']
    const activeIndex = breakpointOrder.indexOf(activeBreakpoint)

    // Look for a value starting from the active breakpoint and going down
    for (let i = activeIndex; i < breakpointOrder.length; i++) {
        const bp = breakpointOrder[i]
        if (values[bp] !== undefined) {
            return values[bp] as T
        }
    }

    // If no matching breakpoint is found, return the default value
    return values.default
}

// Export breakpoints for use in other files
export { Breakpoints }
