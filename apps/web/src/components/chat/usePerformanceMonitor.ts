import {useEffect, useRef} from 'react'

interface PerformanceMetrics {
    renderCount: number
    lastRenderTime: number
    averageRenderTime: number
    componentName: string
}

const performanceData: Map<string, PerformanceMetrics> = new Map()

export const usePerformanceMonitor = (componentName: string) => {
    const renderCountRef = useRef(0)
    const renderStartTime = useRef(0)

    // Track render start
    renderStartTime.current = performance.now()

    useEffect(() => {
        // Track render completion
        const renderEndTime = performance.now()
        const renderTime = renderEndTime - renderStartTime.current

        renderCountRef.current += 1

        const currentData = performanceData.get(componentName) || {
            renderCount: 0,
            lastRenderTime: 0,
            averageRenderTime: 0,
            componentName,
        }

        const newRenderCount = currentData.renderCount + 1
        const newAverageTime = (currentData.averageRenderTime * currentData.renderCount + renderTime) / newRenderCount

        performanceData.set(componentName, {
            renderCount: newRenderCount,
            lastRenderTime: renderTime,
            averageRenderTime: newAverageTime,
            componentName,
        })

        // Log performance data in development
        if (process.env.NODE_ENV === 'development' && newRenderCount % 10 === 0) {
            console.log(`[Performance] ${componentName}:`, {
                renders: newRenderCount,
                lastRender: `${renderTime.toFixed(2)}ms`,
                avgRender: `${newAverageTime.toFixed(2)}ms`,
            })
        }
    }, [componentName])

    return {
        renderCount: renderCountRef.current,
        getMetrics: () => performanceData.get(componentName),
        getAllMetrics: () => Array.from(performanceData.values()),
    }
}

// Hook to track re-render reasons
export const useWhyDidYouUpdate = (name: string, props: Record<string, any>) => {
    const previousProps = useRef<Record<string, any> | undefined>(undefined)

    useEffect(() => {
        if (previousProps.current) {
            const allKeys = Object.keys({...previousProps.current, ...props})
            const changedProps: Record<string, { from: any; to: any }> = {}

            allKeys.forEach(key => {
                if (previousProps.current![key] !== props[key]) {
                    changedProps[key] = {
                        from: previousProps.current![key],
                        to: props[key],
                    }
                }
            })

            if (Object.keys(changedProps).length) {
                console.log('[Why-Did-You-Update]', name, changedProps)
            }
        }

        previousProps.current = props
    }, [name, props])
}

// Performance utility to measure expensive operations
export const measureOperation = <T>(name: string, operation: () => T): T => {
    const start = performance.now()
    const result = operation()
    const end = performance.now()

    if (process.env.NODE_ENV === 'development') {
        console.log(`[Operation] ${name}: ${(end - start).toFixed(2)}ms`)
    }

    return result
}

// Hook for measuring component mount/unmount times
export const useMountTime = (componentName: string) => {
    const mountTime = useRef(0)

    useEffect(() => {
        mountTime.current = performance.now()

        return () => {
            const unmountTime = performance.now()
            const lifetime = unmountTime - mountTime.current

            if (process.env.NODE_ENV === 'development') {
                console.log(`[Lifecycle] ${componentName} lifetime: ${lifetime.toFixed(2)}ms`)
            }
        }
    }, [componentName])
}
