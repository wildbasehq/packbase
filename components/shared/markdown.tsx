import {Heading, Text} from '@/components/shared/text'
import ReactMarkdown from 'react-markdown'

export default function Markdown({children, ...props}: {
    children: string
    [x: string]: any
}) {
    return (
        <ReactMarkdown className="text-sm" components={{
            h1(props) {
                return <Heading {...props}/>
            },
            p(props) {
                return <Text {...props}/>
            }
        }} {...props}>
            {children}
        </ReactMarkdown>
    )
}