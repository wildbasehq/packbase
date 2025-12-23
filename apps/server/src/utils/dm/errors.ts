import {t} from 'elysia'

// Standard error response schema for DM endpoints
export const ErrorResponse = t.Object({
    summary: t.String({description: 'Human-readable error message'}),
    status: t.Number({description: 'HTTP status code'}),
    code: t.Optional(t.String({description: 'Machine-readable error code'})),
})

// Common error response schemas for Swagger documentation
export const CommonErrorResponses = {
    400: ErrorResponse,
    401: ErrorResponse,
    403: ErrorResponse,
    404: ErrorResponse,
    409: ErrorResponse,
    413: ErrorResponse,
    422: ErrorResponse,
    500: ErrorResponse,
}

// DM-specific error codes
export const DM_ERROR_CODES = {
    // Authentication & Authorization
    UNAUTHORIZED: 'DM_UNAUTHORIZED',
    NOT_PARTICIPANT: 'DM_NOT_PARTICIPANT',
    CANNOT_EDIT_MESSAGE: 'DM_CANNOT_EDIT_MESSAGE',
    CANNOT_DELETE_MESSAGE: 'DM_CANNOT_DELETE_MESSAGE',

    // Validation
    USER_ID_REQUIRED: 'DM_USER_ID_REQUIRED',
    CONTENT_REQUIRED: 'DM_CONTENT_REQUIRED',
    CONTENT_TOO_LONG: 'DM_CONTENT_TOO_LONG',
    INVALID_MESSAGE_TYPE: 'DM_INVALID_MESSAGE_TYPE',
    INVALID_REPLY_TO: 'DM_INVALID_REPLY_TO',
    RATE_LIMIT_EXCEEDED: 'DM_RATE_LIMIT_EXCEEDED',

    // Not Found
    CHANNEL_NOT_FOUND: 'DM_CHANNEL_NOT_FOUND',
    MESSAGE_NOT_FOUND: 'DM_MESSAGE_NOT_FOUND',
}