/**
 * Shows a giant critical error message in the console
 */

export default function consoleCriticalError(title: string, message?: string) {
    // If message has new lines, pad them
    if (message?.includes('\n')) {
        message = message.split('\n').map((line, index) => {
            if (index === 0) return line
            return `  ${line}`
        }).join('\n')
    }

    // Pad whole message with 2 lines filled with block characters. Each second character should be ⚠️
    const blockChar = '\u2588'
    const consoleWidth = 128
    const topBottomLines = Array(consoleWidth).fill(blockChar).map((char, index) => {
        if (index % 2 === 0) return '\x1b[31m' + char
        return '\x1b[31m\x1b[41m!\x1b[0m'
    }).join('')
    console.error(topBottomLines)

    console.error(` \x1b[31m\x1b[1m\x1b[4m!! ${title} !!\x1b[0m`)
    if (message) console.error(`  \x1b[31m${message}\x1b[0m`)

    console.error(topBottomLines)
}