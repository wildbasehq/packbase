import {type ClassValue, clsx} from 'clsx'
import {twMerge} from 'tailwind-merge'
import ms from 'ms'

/**
 * The name of the project. All Wolfbite projects should have a name
 * outside the final product name. Should be sent with telemetry and
 * all requests to the server.
 *
 * @projectName Tigao
 * @since 2023-08-23
 * @specific v3 frontend-only rewrite experiment
 * @authors @rek, @jexx
 *
 * @note
 * Check slack, list is reference of related/referenced project.
 * - Project Yipnyap: v1 (@rek)
 * - Nextgen: v2 ui redesign (@rek) (current live)
 * - Feral: v3 fullstack rewrite experiment (@rek)
 * - E: 4v4 shooter (@rek, @haz, @lemon, Studio Klondike)
 * - Tigao: v3 frontend-only rewrite experiment (@rek ui, @jexx attempt)
 */
export const ProjectName = 'Yipnyap'
export const ProjectDeps = ['scalebite', 'ypnyp', 'feral']

/**
 * Get an error code and message
 * @param cause
 * @param format
 */
export const getError = (cause: string, format: 'ThrowError' | 'ATProtoSocket' = 'ATProtoSocket') => {
    const ErrorTable: Record<string, {
        m: string;
        d?: string;
        b?: number;
        r?: boolean;
    }> = {
        EGENERIC: {
            m: 'An unexpected error occurred',
            b: 1,
        },
        EINVALID: {
            m: 'Invalid request',
            b: 2,
        },
        EUNAUTHORIZED: {
            m: 'Unauthorized',
            b: 4,
        },
        CEDISCLOSED: {
            m: '囧',
            d: '',
            b: 8,
            r: true,
        }
    }

    const error = ErrorTable[cause]

    if (!error) return ErrorTable.EGENERIC

    if (error.r) {
        // window.Watchdog?.sendFullDetailReport('error', error, document).then(() => {
        document.querySelector('head')?.remove()
        document.querySelectorAll('script, style').forEach(e => e.remove())
        document.body.style.backgroundColor = '#000'
        document.body.style.margin = '0'
        document.body.style.color = '#fff'
        document.body.style.overflow = 'hidden'

        // centered card with error message
        const card = document.createElement('div')
        card.style.position = 'absolute'
        card.style.top = '50%'
        card.style.left = '50%'
        card.style.transform = 'translate(-50%, -50%)'
        card.style.padding = '2rem'
        card.style.backgroundColor = '#0b0b0b'
        card.style.color = '#fff'
        card.style.border = '4px solid red'
        card.style.borderRadius = '8px'
        card.innerHTML = `<h3>${error.m}</h3>`

        document.body.innerHTML = ''
        document.body.appendChild(card)
        // })
    }

    if (format === 'ThrowError') {
        return {
            cause: error.m,
            message: error.d,
        }
    }

    return error
}

export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
    if (!timestamp) return 'never'
    return `${ms(Date.now() - new Date(timestamp).getTime())}${
        timeOnly ? '' : ' ago'
    }`
}

export async function fetcher<JSON = any>(
    input: RequestInfo,
    init?: RequestInit,
): Promise<JSON> {
    const res = await fetch(input, init)

    if (!res.ok) {
        const json = await res.json()
        if (json.error) {
            const error = new Error(json.error) as Error & {
                status: number;
            }
            error.status = res.status
            throw error
        } else {
            throw new Error('An unexpected error occurred')
        }
    }

    return res.json()
}

export function nFormatter(num: number, digits?: number) {
    if (!num) return '0'
    const lookup = [
        {value: 1, symbol: ''},
        {value: 1e3, symbol: 'K'},
        {value: 1e6, symbol: 'M'},
        {value: 1e9, symbol: 'G'},
        {value: 1e12, symbol: 'T'},
        {value: 1e15, symbol: 'P'},
        {value: 1e18, symbol: 'E'},
    ]
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
    var item = lookup
        .slice()
        .reverse()
        .find(function (item) {
            return num >= item.value
        })
    return item
        ? (num / item.value).toFixed(digits || 1).replace(rx, '$1') + item.symbol
        : '0'
}

export function capitalize(str: string) {
    // noinspection SuspiciousTypeOfGuard - typescript sometimes doesn't throw on mismatch.
    if (!str || typeof str !== 'string') return str
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export const truncate = (str: string, length: number) => {
    if (!str || str.length <= length) return str
    return `${str.slice(0, length)}...`
}


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
