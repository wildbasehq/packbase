export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => ReturnType<T> | undefined {
    let inThrottle: boolean
    let lastResult: ReturnType<T>

    return function (this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
        if (!inThrottle) {
            lastResult = func.apply(this, args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
        return lastResult
    }
}
