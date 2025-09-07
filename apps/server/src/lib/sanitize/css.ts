// Define allowed CSS properties (whitelist approach)
const ALLOWED_PROPERTIES = new Set([
    // Colors and backgrounds
    'color',
    'background',
    'background-color',
    'background-image',
    'background-position',
    'background-repeat',
    'background-size',
    'opacity',

    // Box model
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'box-sizing',

    // Typography
    'font',
    'font-family',
    'font-size',
    'font-weight',
    'font-style',
    'text-align',
    'text-decoration',
    'text-transform',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'white-space',
    'text-overflow',
    'text-indent',
    'vertical-align',

    // Borders
    'border',
    'border-width',
    'border-style',
    'border-color',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'border-radius',
    'border-collapse',

    // Layout
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'float',
    'clear',
    'visibility',
    'overflow',
    'overflow-x',
    'overflow-y',
    'z-index',
    'table-layout',

    // Flexbox
    'flex',
    'flex-direction',
    'flex-wrap',
    'flex-flow',
    'flex-grow',
    'flex-shrink',
    'flex-basis',
    'justify-content',
    'align-items',
    'align-content',
    'align-self',
    'order',

    // Grid
    'grid',
    'grid-template-columns',
    'grid-template-rows',
    'grid-template-areas',
    'grid-column',
    'grid-row',
    'grid-area',
    'grid-gap',
    'gap',
    'column-gap',
    'row-gap',
    'grid-auto-columns',
    'grid-auto-rows',

    // Transforms (safe ones)
    'transform',
    'transform-origin',
    'rotate',
    'scale',
    'translate',

    // Transitions and animations
    'transition',
    'transition-property',
    'transition-duration',
    'transition-timing-function',
    'transition-delay',
    'animation',
    'animation-name',
    'animation-duration',
    'animation-timing-function',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',

    // Other
    'cursor',
    'pointer-events',
    'list-style',
    'list-style-type',
    'outline',
    'box-shadow',
    'text-shadow',
    'object-fit',
    'object-position',
    'backdrop-filter',
    'filter',
]);

// Dangerous functions and protocols
const DANGEROUS_FUNCTIONS = /\b(expression|eval|javascript|behavior|mozbinding)\s*\(/i;
const DANGEROUS_PROTOCOLS = /(javascript|data|vbscript|file):/i;

/**
 * Checks if a background URL is unsafe by validating the hostname
 * @param value The CSS property value to check
 * @returns boolean indicating if the URL is unsafe
 */
const isUnsafeBackgroundUrl = (value: string): boolean => {
    // Check if the value contains a url() function
    const urlMatch = value.match(/url\(\s*['"]?([^'"]+)['"]?\s*\)/i);
    if (!urlMatch) return false; // No URL, considered safe

    const url = urlMatch[1];

    // If it starts with http:// or https://, check the hostname
    if (/^https?:\/\//i.test(url)) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.hostname !== 'profiles.cdn.packbase.app';
        } catch (e) {
            // If parsing fails, consider it dangerous
            return true;
        }
    }

    // Allow relative URLs (they're from the same origin)
    return false;
};

// Map of property names to dangerous values
const DANGEROUS_VALUES: Record<string, Set<string> | RegExp | ((value: string) => boolean)> = {
    // Layout positioning
    position: new Set(['fixed', 'sticky', 'absolute']),
    // z-index check using function validator
    'z-index': (value: string) => parseInt(value, 10) > 9999, // Very high z-index values

    // Overflow control
    overflow: /(auto|scroll)/i,
    'overflow-x': /(auto|scroll)/i,
    'overflow-y': /(auto|scroll)/i,

    // Event handling
    'pointer-events': new Set(['none']),
    'touch-action': new Set(['none']),

    // Visibility and interactions
    visibility: new Set(['hidden', 'collapse']),
    // opacity: (value: string) => parseFloat(value) < 0.2, // Very transparent elements

    // Content control
    content: /url\(|attr\(/i,

    // Import-related
    '@import': /.*/i, // Block all imports

    // Filter effects that could impact performance
    filter: /(blur\([^)]+\)|hue-rotate|drop-shadow)/i,
    'backdrop-filter': /(blur\([^)]+\)|hue-rotate|drop-shadow)/i,

    // Animation potentially causing performance issues
    // 'animation-iteration-count': (value: string) => value === 'infinite' || parseInt(value, 10) > 100,
    // 'animation-duration': (value: string) => parseFloat(value) > 10, // Over 10 seconds

    // Transforms that may cause excessive resource usage
    transform: /(matrix|rotate3d|perspective)/i,

    // Background elements that could contain problematic content
    background: isUnsafeBackgroundUrl,
    'background-image': isUnsafeBackgroundUrl,

    // Font loading
    'font-family': /(^|,)\s*system\b/i, // System fonts sometimes exploitable

    // Cursor potentially confusing users
    cursor: new Set(['none', 'progress', 'wait', 'not-allowed']),

    // Width and height extremes
    width: (value: string) => value === '100vw' || parseInt(value, 10) > 5000,
    height: (value: string) => value === '100vh' || parseInt(value, 10) > 5000,
};

/**
 * Extracts keyframes blocks from CSS using brace counting
 * @param css The CSS string to extract keyframes from
 * @returns Object containing array of keyframe blocks and remaining CSS
 */
function extractKeyframes(css: string): { keyframes: Array<{ full: string; name: string; body: string }>; remainingCSS: string } {
    const keyframes: Array<{ full: string; name: string; body: string }> = [];
    let remainingCSS = css;
    let startIndex = 0;

    while (true) {
        const keyframeStart = remainingCSS.indexOf('@keyframes', startIndex);
        if (keyframeStart === -1) break;

        // Find the opening brace
        const openBrace = remainingCSS.indexOf('{', keyframeStart);
        if (openBrace === -1) break;

        // Extract the keyframe name
        const declaration = remainingCSS.substring(keyframeStart, openBrace).trim();

        // Count braces to find the complete keyframes block
        let braceCount = 1;
        let i = openBrace + 1;

        while (i < remainingCSS.length && braceCount > 0) {
            if (remainingCSS[i] === '{') braceCount++;
            else if (remainingCSS[i] === '}') braceCount--;
            i++;
        }

        if (braceCount === 0) {
            const keyframeBlock = remainingCSS.substring(keyframeStart, i);
            const body = remainingCSS.substring(openBrace + 1, i - 1);

            keyframes.push({
                full: keyframeBlock,
                name: declaration,
                body: body,
            });

            // Remove the keyframe block from remaining CSS
            remainingCSS = `${remainingCSS.substring(0, keyframeStart)}__KEYFRAME_${keyframes.length - 1}__${remainingCSS.substring(i)}`;
            startIndex = keyframeStart + ('__KEYFRAME_' + (keyframes.length - 1) + '__').length;
        } else {
            break;
        }
    }

    return { keyframes, remainingCSS };
}

/**
 * Sanitizes CSS using a whitelist approach and pattern detection
 * @param css The CSS string to sanitize
 * @returns The sanitized CSS string
 */
export function sanitizeCSS(css: string): string {
    if (!css) return '';

    // Check if the input only contains comments
    const onlyCommentsRegex = /^(\s*\/\*[\s\S]*?\*\/\s*)*$/;
    if (onlyCommentsRegex.test(css)) {
        return css; // Return comments-only CSS unchanged
    }

    // Extract and preserve comments
    const comments: string[] = [];
    const commentRegex = /\/\*[\s\S]*?\*\//g;
    const cssWithoutComments = css.replace(commentRegex, (match) => {
        comments.push(match);
        return `__COMMENT_${comments.length - 1}__`;
    });

    let sanitizedCSS = '';
    // Check if the CSS includes structured rules with selectors
    if (cssWithoutComments.includes('{')) {
        // Process structured CSS with selectors
        const result = [];

        // First extract and handle @keyframes rules
        const { keyframes, remainingCSS: processedCSS } = extractKeyframes(cssWithoutComments);

        // Process each keyframe
        const sanitizedKeyframes: string[] = [];
        for (const keyframe of keyframes) {
            const sanitizedBody = sanitizeKeyframesBody(keyframe.body);
            if (sanitizedBody) {
                sanitizedKeyframes.push(`${keyframe.name} {\n${sanitizedBody}}`);
            }
        }

        // Then handle regular CSS rules
        const ruleRegex = /([^{]+)\{([\s\S]*?)\}/g;
        let ruleMatch;

        while ((ruleMatch = ruleRegex.exec(processedCSS)) !== null) {
            const selector = ruleMatch[1].trim();
            // Skip empty selectors or keyframe placeholders
            if (!selector || selector.startsWith('__KEYFRAME_')) continue;

            // Pass the raw declaration block to preserve all formatting
            const declarations = sanitizeDeclarations(ruleMatch[2]);

            if (declarations) {
                // Preserve the original formatting by not adding extra spaces
                result.push(`${selector} {\n${declarations}}`);
            }
        }

        // Add sanitized keyframes back
        result.unshift(...sanitizedKeyframes);

        // Replace keyframe placeholders in any remaining text
        let finalCSS = processedCSS.replace(ruleRegex, '');
        for (let i = 0; i < sanitizedKeyframes.length; i++) {
            finalCSS = finalCSS.replace(`__KEYFRAME_${i}__`, '');
        }

        // Determine line ending from original input
        const lineEnding = css.includes('\r\n') ? '\r\n' : '\n';
        sanitizedCSS = result.join(lineEnding);
    } else {
        // Process inline CSS (property:value pairs)
        sanitizedCSS = sanitizeDeclarations(cssWithoutComments);
    }

    // If after processing we have an empty result but had comments,
    // return the original to preserve comments
    if (sanitizedCSS.trim() === '' && comments.length > 0) {
        return css;
    }

    // Restore comments in the sanitized CSS
    return sanitizedCSS.replace(/__COMMENT_(\d+)__/g, (_, index) => comments[parseInt(index, 10)]);
}

function sanitizeKeyframesBody(keyframesBody: string): string {
    const result: string[] = [];
    // Match keyframe selectors (0%, 50%, 100%, from, to) and their declaration blocks
    const keyframeRegex = /([^{]+)\{([\s\S]*?)\}/g;
    let match;

    while ((match = keyframeRegex.exec(keyframesBody)) !== null) {
        const keyframeSelector = match[1].trim();
        const declarations = match[2];

        // Validate keyframe selector (should be percentage, 'from', or 'to')
        if (/^(from|to|\d+(\.\d+)?%)$/.test(keyframeSelector)) {
            const sanitizedDeclarations = sanitizeDeclarations(declarations);
            if (sanitizedDeclarations) {
                result.push(`  ${keyframeSelector} {\n    ${sanitizedDeclarations.replace(/\n/g, '\n    ').trim()}\n  }\n`);
            }
        }
    }

    return result.join('\n');
}

function sanitizeDeclarations(css: string): string {
    const declarations: string[] = [];
    // Use a better regex pattern that properly captures multi-line values
    // This pattern will match property:value pairs even when values contain newlines
    const rulesRegex = /([^:;]+)\s*:\s*([\s\S]*?)(?:;|$|\n(?=[^:]*:))/gm;
    let match;

    while ((match = rulesRegex.exec(css)) !== null) {
        const property = match[1].trim().toLowerCase();
        // Keep the original value with all whitespace and newlines
        const value = match[2];

        // Only allow whitelisted properties
        if (ALLOWED_PROPERTIES.has(property)) {
            // Check for dangerous patterns in values
            if (!DANGEROUS_FUNCTIONS.test(value) && !DANGEROUS_PROTOCOLS.test(value)) {
                // Check for property-specific dangerous values
                const dangerousValue = DANGEROUS_VALUES[property];
                let isDangerous = false;

                if (dangerousValue) {
                    if (dangerousValue instanceof Set) {
                        // For set comparison, we need to trim, but preserve original in output
                        isDangerous = dangerousValue.has(value.toLowerCase().trim());
                    } else if (dangerousValue instanceof RegExp) {
                        isDangerous = dangerousValue.test(value);
                    } else if (typeof dangerousValue === 'function') {
                        isDangerous = dangerousValue(value);
                    }
                }

                if (!isDangerous) {
                    // Preserve original formatting including newlines by using the raw value
                    declarations.push(`${property}: ${value};\n`);
                }
            }
        }
    }

    return declarations.join('');
}

export default sanitizeCSS;
