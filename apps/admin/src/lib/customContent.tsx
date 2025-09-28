import React from 'react'
import * as Carbon from '@carbon/react'
import * as Products from '@carbon/ibm-products'
import * as Security from '@carbon/ibm-security'
import * as Icons from '@carbon/icons-react'

export type CustomRenderResult = {
    element?: React.ReactNode
    html?: string
    error?: string
}

declare global {
    interface Window {
        Babel?: any
    }
}

async function ensureBabel(): Promise<any> {
    if (typeof window === 'undefined') return undefined
    return window.Babel
}

async function compileSource(source: string): Promise<string> {
    const Babel = await ensureBabel()
    if (!Babel) return source
    try {
        const result = Babel.transform(source, {
            presets: ['react'],
            plugins: ['transform-modules-commonjs'],
            sourceType: 'module',
        })
        return result.code || source
    } catch (_ignored) {
        return source
    }
}

export async function evaluateCustomContent(code: string, data: unknown[]): Promise<CustomRenderResult> {
    if (!code || !code.trim()) return {}
    try {
        const compiled = await compileSource(code)
        const factory = new Function(
            'React',
            'Carbon',
            'Products',
            'Security',
            'Icons',
            `"use strict";
            const module = { exports: {} };
            const exports = module.exports;
            ${compiled}
            return module.exports.default ?? module.exports;`
        ) as (r: typeof React, c: typeof Carbon, p: typeof Products, s: typeof Security, i: typeof Icons) => unknown

        const exported = factory(React, Carbon as any, Products as any, Security as any, Icons as any)
        if (typeof exported !== 'function') {
            return { error: 'Custom content must export a default function.' }
        }

        const result = (exported as (rows: unknown[]) => unknown)(data)
        if (React.isValidElement(result as any)) return { element: result as React.ReactNode }
        if (typeof result === 'string') return { html: result }
        if (Array.isArray(result)) return { element: React.createElement(React.Fragment, null, ...(result as any)) }
        return { error: 'Unsupported return type from custom content.' }
    } catch (e: any) {
        const message = e?.message || String(e)
        if (message.includes("Unexpected token '<'")) {
            return { error: "JSX detected but couldn't be compiled. Please try again or return a string." }
        }
        return { error: message }
    }
}

export default evaluateCustomContent
