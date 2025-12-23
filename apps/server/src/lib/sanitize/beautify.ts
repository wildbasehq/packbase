import {css as cssBeautify} from 'js-beautify'

/**
 * Beautifies minified CSS using js-beautify library
 *
 * @param css The minified CSS string to beautify
 * @param options Optional configuration options
 * @returns Beautified CSS string
 */
export function beautifyCSS(css: string, options?: any): string {
    return cssBeautify(css, {
        indent_size: 2,
        indent_char: ' ',
        indent_with_tabs: false,
        preserve_newlines: true,
        max_preserve_newlines: 1,
        ...options
    })
}

export default beautifyCSS