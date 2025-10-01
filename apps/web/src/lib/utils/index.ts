/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

export const truncate = (str: string, length: number) => {
    if (!str || str.length <= length) return str
    return `${str.slice(0, length)}...`
}

export const isVisible = (yes: boolean): 'visible' | 'hidden' => {
    return yes ? 'visible' : 'hidden'
}

export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

declare global {
    // noinspection ES6ConvertVarToLetConst - It fails the type check otherwise
    var log: {
        info: (...content: any[]) => void
        error: (...content: any[]) => void
        warn: (...content: any[]) => void
        debug: (...content: any[]) => void
    }
}

globalThis.log = {
    info: (prefix, ...content) => {
        console.log(`%c[${prefix}]`, 'color: #4F46E5; font-weight: bold;', ...content)
    },

    error: (prefix, ...content) => {
        console.log(`%c[${prefix}]`, 'color: #DC2626; font-weight: bold;', ...content)
    },

    warn: (prefix, ...content) => {
        console.log(`%c[${prefix}]`, 'color: #D97706; font-weight: bold;', ...content)
    },

    debug: (prefix, ...content) => {
        console.log(`%c[${prefix}]`, 'color: #059669; font-weight: bold;', ...content)
    },
}

export * from './cn'
