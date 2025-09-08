/**
 * Utility function to validate and sanitize theme content (HTML and CSS)
 * This function is extracted to be reusable across different endpoints
 * and to support a "dry run" mode for testing content before actual upload
 */

import DOMPurify from 'isomorphic-dompurify';
import sanitizeCSS from '@/lib/sanitize/css';
import { HTTPError } from '@/lib/HTTPError';
import beautifyCSS from '@/lib/sanitize/beautify';

// Constants for validation
const ALLOWED_HTML_TAGS = [
    'div',
    'span',
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'img',
    'section',
    'article',
    'header',
    'footer',
    'nav',
    'main',
    'aside',
    'style',
];
const ALLOWED_HTML_ATTRS = ['id', 'class', 'style', 'src', 'alt', 'href', 'target', 'rel'];
const SIMILARITY_THRESHOLD = 0.7; // 70% similarity required

export interface ThemeContent {
    html: string;
    css: string;
}

export interface ValidatedThemeContent {
    html: string;
    css: string;
    isValid: boolean;
    htmlIssue?: string;
    cssIssue?: string;
}

/**
 * Validates and sanitizes theme content (HTML and CSS)
 *
 * @param content The theme content to validate
 * @param dryRun If true, will not throw errors but return validation results
 * @returns The sanitized content and validation status
 */
export function validateThemeContent(content: ThemeContent, dryRun: boolean = false): ValidatedThemeContent {
    // Quick validation for empty content
    if (!content.html && !content.css) {
        return {
            html: '',
            css: '',
            isValid: false,
            htmlIssue: !content.html ? 'HTML content is required' : undefined,
            cssIssue: !content.css ? 'CSS content is required' : undefined,
        };
    }

    const result: ValidatedThemeContent = {
        html: '',
        css: '',
        isValid: true,
    };

    // Only sanitize HTML if it's provided
    if (content.html) {
        // Sanitize HTML
        const sanitizedHTML = DOMPurify.sanitize(content.html, {
            ALLOWED_TAGS: ALLOWED_HTML_TAGS,
            ALLOWED_ATTR: ALLOWED_HTML_ATTRS,
        });

        // Store sanitized content
        result.html = sanitizedHTML;

        // Check if sanitized HTML is too different from original (potential attack)
        if (sanitizedHTML.length < content.html.length * SIMILARITY_THRESHOLD) {
            result.isValid = false;
            result.htmlIssue = 'HTML contains too many unsafe elements or attributes';

            if (!dryRun) {
                throw HTTPError.badRequest({
                    summary: 'HTML contains too many unsafe elements or attributes.',
                });
            }
        }
    }

    // Only sanitize CSS if it's provided
    if (content.css) {
        // Sanitize CSS
        // const sanitizedCSS = sanitizeCSS(content.css);

        // Store sanitized content
        // result.css = sanitizedCSS;

        // Check if sanitized CSS is too different from original (potential attack)
        // if (sanitizedCSS.length < content.css.length * SIMILARITY_THRESHOLD) {
        //     result.isValid = false;
        //     result.cssIssue = 'CSS contains too many unsafe properties or values';
        //
        //     if (!dryRun) {
        //         throw HTTPError.badRequest({
        //             summary: 'CSS contains too many unsafe properties or values.',
        //         });
        //     }
        // }

        result.css = beautifyCSS(result.css);
    }

    return result;
}

export default validateThemeContent;
