import {Heading, Text} from '@/components/shared/text'
import ReactMarkdown from 'react-markdown'
import {Pre} from '@/components/shared/code.tsx'

export default function Markdown({children, ...props}: { children: string; [x: string]: any }) {
    // Check for numbers followed by a period, and if so, replace with \.
    children = children?.replace(/(\d+)\./g, '$1\\.')

    return (
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
                pre: (props) => {
                    return <Pre code={props.children?.toString()} title={''}>
                        {props.children}
                    </Pre>
                },
                // code: (props) => {
                //     return <Code {...props} />
                // }
            }}
            {...props}
        >
            {children}
        </ReactMarkdown>
    )
}
