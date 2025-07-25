/*
 * Copyright (c) Wildbase 2025. All rights and ownership reserved. Not for distribution.
 */

import { Heading, Text } from '@/components/shared/text'
import ReactMarkdown from 'react-markdown'
import { Pre } from '@/components/shared/code.tsx'

export default function Markdown({ children, ...props }: { children: string; [x: string]: any }) {
    // Check for numbers followed by a period, and if so, replace with \.
    children = children?.replace(/(\d+)\./g, '$1\\.')

    return (
        <div className="prose-sm dark:prose-invert prose-headings:font-title font-default max-w-full">
            <ReactMarkdown
                components={{
                    h1(props) {
                        return <Heading as="h1" size="3xl" {...props} />
                    },
                    h2(props) {
                        return <Heading as="h2" size="2xl" {...props} />
                    },
                    h3(props) {
                        return <Heading as="h3" size="xl" {...props} />
                    },
                    p(props) {
                        return <Text {...props} />
                    },
                    ul(props) {
                        return <ul className="list-disc pl-4" {...props} />
                    },
                    ol(props) {
                        return <ol className="list-decimal pl-4" {...props} />
                    },
                    pre: props => {
                        return (
                            <Pre code={props.children?.toString()} title={''}>
                                {props.children}
                            </Pre>
                        )
                    },
                    code: props => {
                        return <code className="rounded-md bg-stone-200 px-1.5 py-1 font-mono font-medium text-stone-900" {...props} />
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
                {...props}
            >
                {children}
            </ReactMarkdown>
        </div>
    )
}
