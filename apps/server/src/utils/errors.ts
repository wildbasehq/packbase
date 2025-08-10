import {t} from 'elysia'

interface InternalError {
    name: string;
    cause?: any;
    message?: string;
}

export default function ThrowError(message: {
    name: string;
    cause?: any;
    message?: string;
}) {
    const error = new Error(message.message || message.name, message.cause ? {
        cause: message.cause
    } : undefined)

    error.name = message.name

    return error
}

export function HTTPError(set: any, status: number, error: {
    cause?: string;
    code?: string;
    name?: string;
    message?: string;
    detail?: any;
    value?: { summary: string }
}) {
    set.status = status
    return error
}

export const ErrorTypebox = t.Object({
    summary: t.String(),
}, {
    additionalProperties: t.Any(),
})