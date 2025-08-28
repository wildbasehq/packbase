/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { Heading, Text } from '@/components/shared/text'
import ReactMarkdown from 'react-markdown'
import { Pre } from '@/components/shared/code.tsx'
import { createElement, Children, isValidElement, cloneElement } from 'react'
import CreatedByHumans from '@/src/images/svg/noai/created.svg'
import { clsx } from 'clsx'

// Dot SVG component
const DotIcon = ({ className }: { className?: string }) => (
    <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="3" cy="3" r="3" fill="currentColor" />
    </svg>
)

// Custom UL component that uses dot SVG and replaces li with Text
const CustomUL = ({ children, className, ...props }: any) => {
    const processedChildren = Children.map(children, child => {
        if (isValidElement(child) && child.type === 'li') {
            return (
                <div className="flex items-start gap-2 my-1" key={child.key}>
                    <DotIcon className="mt-1.5 text-stone-500 flex-shrink-0" />
                    {/* @ts-ignore */}
                    <Text className="flex-1">{child.props.children}</Text>
                </div>
            )
        }
        return child
    })

    return (
        <div className={clsx('space-y-2', className)} {...props}>
            {processedChildren}
        </div>
    )
}

/**
 * @TODO Move this into its own utility
 * Howlertag
 *
 * Handles converting {% code %} into actual markdown components
 *
 * % sign can be replaced with other handlers.
 *
 * % = Generic component (normal HTML)
 * More later
 */

/**
 * Create a howlertag handler
 */
class HowlertagHandler {
    constructor(
        public tag: string,
        public component: React.FC<any>
    ) {
        this.tag = tag
        this.component = component
    }

    matches(text: string): boolean {
        return text.includes(`{${this.tag}`)
    }

    parse(text: string): { content: string; props: any } {
        const regex = new RegExp(`{${this.tag}(.*?)}(.*?){/${this.tag}}`, 's')
        const match = text.match(regex)

        if (!match) return { content: '', props: {} }

        const propsString = match[1].trim()
        const content = match[2]

        let parsedProps = {}

        if (propsString) {
            try {
                // First, try to normalize the props string to valid JSON
                const normalizedProps = this.normalizePropsString(propsString)
                parsedProps = JSON.parse(`{${normalizedProps}}`)
            } catch (error) {
                console.warn(`Invalid props format for ${this.tag}: ${propsString}`)

                // Fallback: try to parse simple key-value pairs manually
                parsedProps = this.parsePropsManually(propsString)
            }
        }

        return {
            content,
            props: parsedProps,
        }
    }

    render(text: string): React.ReactElement | null {
        if (!this.matches(text)) return null

        const { content, props } = this.parse(text)
        return createElement(this.component, { ...props }, content)
    }

    private normalizePropsString(propsString: string): string {
        return (
            propsString
                // Replace single quotes with double quotes for string values
                .replace(/(\w+):\s*'([^']*)'/g, '"$1": "$2"')
                // Handle unquoted property names
                .replace(/(\w+):\s*"([^"]*)"/g, '"$1": "$2"')
                // Handle unquoted property names with unquoted values (assuming they're strings)
                .replace(/(\w+):\s*([^,}\s]+)/g, '"$1": "$2"')
                // Handle boolean and numeric values
                .replace(/"\b(true|false|\d+\.?\d*)\b"/g, '$1')
        )
    }

    private parsePropsManually(propsString: string): any {
        const props: any = {}

        // Simple regex to match key:value pairs
        const pairs = propsString.match(/(\w+):\s*(['"]?)([^,}]*)\2/g)

        if (pairs) {
            pairs.forEach(pair => {
                const [, key, , value] = pair.match(/(\w+):\s*(['"]?)([^,}]*)\2/) || []
                if (key && value !== undefined) {
                    // Try to parse as number or boolean
                    if (value === 'true') props[key] = true
                    else if (value === 'false') props[key] = false
                    else if (!isNaN(Number(value)) && value !== '') props[key] = Number(value)
                    else props[key] = value
                }
            })
        }

        return props
    }
}

/**
 * Converts Howlertag to React
 *
 * @param {string} content
 * @returns {JSX.Element}
 * @constructor
 */
class HowlertagConverter {
    handlers: HowlertagHandler[] = []

    addHandler(handler: HowlertagHandler) {
        this.handlers.push(handler)
    }

    convert(text: string): (React.ReactElement | string)[] {
        const results: (React.ReactElement | string)[] = []
        let remainingText = text
        let processed = false

        for (const handler of this.handlers) {
            if (handler.matches(remainingText)) {
                const regex = new RegExp(`{${handler.tag}(.*?)}(.*?){/${handler.tag}}`, 's')
                const match = remainingText.match(regex)

                if (match) {
                    const beforeMatch = remainingText.substring(0, match.index)
                    const afterMatch = remainingText.substring(match.index! + match[0].length)

                    if (beforeMatch) results.push(beforeMatch)

                    const element = handler.render(match[0])
                    if (element) results.push(element)

                    // Recursively process the remaining text
                    if (afterMatch) {
                        const recursiveResults = this.convert(afterMatch)
                        results.push(...recursiveResults)
                    }

                    processed = true
                    break
                }
            }
        }

        if (!processed) {
            results.push(remainingText)
        }

        return results
    }
}

const ForwardIMG = ({ src, className }: { src: string; className?: string }) => {
    const quicktags: { tag: string; src: string }[] = [
        {
            tag: 'noai_created',
            src: CreatedByHumans,
        },
    ]

    const srcToQuicktag = (src: string) => {
        const quicktag = quicktags.find(quicktag => src === quicktag.tag)
        if (quicktag) {
            return quicktag.src
        }
        return src
    }

    return <img src={srcToQuicktag(src || 'error.png')} className={className} alt="" loading="lazy" />
}

const GenericHTMLImageHandler = new HowlertagHandler('img', ForwardIMG)
const Howlertag = new HowlertagConverter()
Howlertag.addHandler(GenericHTMLImageHandler)

export default function Markdown({ children, componentClassName }: { children: string; componentClassName?: string; [x: string]: any }) {
    // Check for numbers followed by a period, and if so, replace with \.
    children = children?.replace(/(\d+)\./g, '$1\\.')

    const convertedContent = Howlertag.convert(children)

    return (
        <div className="prose-sm dark:prose-invert prose-headings:font-title font-default max-w-full">
            {convertedContent.map((item, index) => {
                if (typeof item === 'string') {
                    return (
                        <ReactMarkdown
                            key={index}
                            components={{
                                h1(props) {
                                    return <Heading as="h1" size="3xl" className={clsx(props.className, componentClassName)} {...props} />
                                },
                                h2(props) {
                                    return <Heading as="h2" size="2xl" className={clsx(props.className, componentClassName)} {...props} />
                                },
                                h3(props) {
                                    return <Heading as="h3" size="xl" className={clsx(props.className, componentClassName)} {...props} />
                                },
                                p(props) {
                                    return <Text className={clsx(props.className, componentClassName)} {...props} />
                                },
                                ul(props) {
                                    return (
                                        <CustomUL
                                            className={clsx('text-sm text-default select-none', props.className, componentClassName)}
                                            {...props}
                                        />
                                    )
                                },
                                ol(props) {
                                    return (
                                        <ol
                                            className={clsx(
                                                'text-sm text-default select-none list-decimal pl-4 space-y-1',
                                                props.className,
                                                componentClassName
                                            )}
                                            {...props}
                                        />
                                    )
                                },
                                pre: props => {
                                    return (
                                        <Pre code={props.children?.toString()} title={''}>
                                            {props.children}
                                        </Pre>
                                    )
                                },
                                code: props => {
                                    return (
                                        <code
                                            className="rounded-md bg-stone-200 px-1.5 py-1 font-mono font-medium text-stone-900"
                                            {...props}
                                        />
                                    )
                                },
                                blockquote: props => {
                                    return <blockquote className="border-l-4 border-stone-700 pl-4" {...props} />
                                },
                                a: props => {
                                    return (
                                        <a
                                            className="text-indigo-500 underline underline-offset-[3px] hover:text-indigo-500/80 transition-colors cursor-pointer"
                                            target="_blank"
                                            {...props}
                                        />
                                    )
                                },
                                hr: props => {
                                    return <hr className="mt-4 mb-6 border-t border-stone-300" {...props} />
                                },
                                img: props => {
                                    return <img className="rounded-lg border border-stone-200" {...props} />
                                },
                            }}
                        >
                            {item}
                        </ReactMarkdown>
                    )
                } else {
                    return <div key={index}>{item}</div>
                }
            })}
        </div>
    )
}
