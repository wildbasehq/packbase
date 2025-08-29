// src/utils/errors/HTTPError.ts

/**
 * Type definition for HTTPError constructor parameters
 */
export interface HTTPErrorParams {
    /** Error summary message (required) */
    summary: string;

    /** HTTP status code (optional, defaults to 500) */
    status?: number;

    /** Error code for client identification (optional) */
    code?: string;

    /** Original error if this wraps another error (optional) */
    originalError?: Error;

    /** Any additional properties (optional) */
    [key: string]: any;
}

/**
 * Information about the caller of the error
 */
interface CallerInfo {
    /** Function name that called the error */
    functionName: string;

    /** File path where the error was thrown */
    filePath: string;

    /** Line number where the error was thrown */
    lineNumber: number;

    /** Column number where the error was thrown */
    columnNumber: number;
}

/**
 * HTTPError - Standardized error handling for HTTP responses
 *
 * A consistent error class that includes HTTP status code, summary message,
 * and optional additional error details.
 */
export class HTTPError extends Error {
    /** HTTP status code */
    public status: number

    /** Error summary message */
    public summary: string

    /** Original error if this wraps another error */
    public originalError?: Error

    /** Error code for client identification */
    public code?: string

    /** Information about the caller */
    public caller: CallerInfo

    /** Additional error properties */
    [key: string]: any;

    /**
     * Create a new HTTPError
     *
     * @param params Error parameters including required summary and optional status code
     */
    constructor(params: HTTPErrorParams) {
        // Initialize with summary as the main error message
        super(params.summary)

        // Set name for better debugging
        this.name = 'HTTPError'

        // Store the summary separately for consistency
        this.summary = params.summary

        // Default status code to 500 if not provided
        this.status = params.status || 500

        // Copy all other properties
        Object.keys(params).forEach(key => {
            if (key !== 'summary' && key !== 'status') {
                this[key] = params[key]
            }
        })

        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HTTPError)
        }

        // Extract caller information
        this.caller = this.extractCallerInfo()
    }

    /**
     * Extract information about the caller from the stack trace
     */
    private extractCallerInfo(): CallerInfo {
        const defaultInfo = {
            functionName: 'unknown',
            filePath: 'unknown',
            lineNumber: 0,
            columnNumber: 0
        }

        try {
            // Get the stack trace
            const stackLines = this.stack?.split('\n') || []

            // Skip the first line (error message) and the second line (HTTPError constructor)
            // The third line should be the caller
            const callerLine = stackLines[2] || ''

            // Extract information using a regex that works for Node.js and most browsers
            // Format varies, but generally follows: "at FunctionName (/path/to/file.js:line:column)"
            // or "at /path/to/file.js:line:column"
            const regex = /at\s+(.*)\s+\((.+):(\d+):(\d+)\)|at\s+(.+):(\d+):(\d+)/
            const match = regex.exec(callerLine)

            if (match) {
                // There are two formats captured by the regex
                if (match[1]) {
                    // Format: "at FunctionName (/path/to/file.js:line:column)"
                    return {
                        functionName: match[1] || 'anonymous',
                        filePath: match[2] || 'unknown',
                        lineNumber: parseInt(match[3] || '0', 10),
                        columnNumber: parseInt(match[4] || '0', 10)
                    }
                } else {
                    // Format: "at /path/to/file.js:line:column"
                    return {
                        functionName: 'anonymous',
                        filePath: match[5] || 'unknown',
                        lineNumber: parseInt(match[6] || '0', 10),
                        columnNumber: parseInt(match[7] || '0', 10)
                    }
                }
            }

            return defaultInfo
        } catch (error) {
            // If anything goes wrong parsing the stack, return default info
            return defaultInfo
        }
    }

    /**
     * Serialize the error for responses
     */
    toJSON() {
        const result: Record<string, any> = {
            summary: this.summary,
            status: this.status
        }

        // Include all properties except internal ones
        Object.keys(this).forEach(key => {
            if (!['name', 'message', 'stack', 'originalError'].includes(key)) {
                    // Handle BigInt conversion for JSON serialization
                    const value = this[key];
                    result[key] = typeof value === 'bigint' ? Number(value) : value;
            }
        })

        return result
    }

    /**
     * Create a Bad Request (400) error
     */
    static badRequest(params: { summary: string; [key: string]: any }) {
        return new HTTPError({...params, status: 400})
    }

    /**
     * Create an Unauthorized (401) error
     */
    static unauthorized(params: { summary: string; [key: string]: any }) {
        return new HTTPError({...params, status: 401})
    }

    /**
     * Create a Forbidden (403) error
     */
    static forbidden(params: { summary: string; [key: string]: any }) {
        return new HTTPError({...params, status: 403})
    }

    /**
     * Create a Not Found (404) error
     */
    static notFound(params: { summary: string; [key: string]: any }) {
        return new HTTPError({...params, status: 404})
    }

    /**
     * Create a Conflict (409) error
     */
    static conflict(params: { summary: string; [key: string]: any }) {
        return new HTTPError({...params, status: 409})
    }

    /**
     * Create a Payload Too Large (413) error
     */
    static payloadTooLarge(params: { summary: string; [key: string]: any }) {
        return new HTTPError({...params, status: 413})
    }

    /**
     * Create a Validation Error (422) error
     */
    static validation(params: { summary: string; [key: string]: any }) {
        return new HTTPError({...params, status: 422})
    }

    /**
     * Create a Server Error (500) error
     */
    static serverError(params: { summary: string; [key: string]: any }) {
        return new HTTPError({...params, status: 500})
    }

    /**
     * Create an error from a database or external error
     *
     * @param error The original error to convert
     * @param defaultSummary Default summary to use if no message is found in the error
     */
    static fromError(error: any, defaultSummary: string = 'An error occurred'): HTTPError {
        // If it's already an HTTPError, just return it
        if (error instanceof HTTPError) {
            return error
        }

        // Extract properties from the error
        const summary = error.message || error.summary || defaultSummary
        const status = error.status || error.statusCode || 500
        const code = error.code || error.errorCode

        // Create a new HTTPError with the extracted properties
        const httpError = new HTTPError({
            summary,
            status,
            code,
            originalError: error instanceof Error ? error : undefined
        })

        // Copy any other properties from the original error
        if (typeof error === 'object') {
            Object.keys(error).forEach(key => {
                if (!['message', 'summary', 'status', 'statusCode', 'code', 'errorCode'].includes(key)) {
                    httpError[key] = error[key]
                }
            })
        }

        return httpError
    }
}

/**
 * Type guard to check if an object is an HTTPError
 */
export function isHTTPError(error: any): error is HTTPError {
    return error instanceof HTTPError
}